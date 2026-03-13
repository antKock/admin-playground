import { Injectable, signal } from '@angular/core';

/**
 * OpenAPI Change Detection Banner
 *
 * At runtime, fetches the live openapi.json from the API and compares it
 * against openapi-baseline.json (bundled at build time, committed in git).
 *
 * Banner visible? → The live API has changed since the last acknowledgment.
 * To dismiss the banner:
 *   1. npm run api:generate     — downloads the latest spec + regenerates types
 *   2. Adapt your code to the new/changed API endpoints and schemas
 *   3. npm run api:acknowledge  — copies the spec into the baseline
 *   4. Commit the updated openapi-baseline.json
 *
 * The banner reappears only when the live API changes again.
 */

export interface OpenApiChange {
  type: 'added' | 'removed' | 'modified';
  category: 'path' | 'schema';
  name: string;
  before?: unknown;
  after?: unknown;
}

/** Uses the same /api proxy as the rest of the app to avoid CORS issues. */
const OPENAPI_URL = '/api/openapi.json';

@Injectable({ providedIn: 'root' })
export class OpenApiWatcherService {
  readonly changes = signal<OpenApiChange[] | null>(null);

  async check(): Promise<void> {
    try {
      let baseline: Record<string, unknown>;
      try {
        baseline = (await import('@core/api/generated/openapi-baseline.json')).default as Record<string, unknown>;
      } catch {
        console.warn('[OpenAPI Watcher] Baseline not found — run: npm run api:acknowledge');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      let response: Response;
      try {
        response = await fetch(OPENAPI_URL, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        console.warn(`[OpenAPI Watcher] Fetch failed with status ${response.status}`);
        return;
      }

      let liveSpec: Record<string, unknown>;
      try {
        liveSpec = await response.json();
      } catch {
        console.warn('[OpenAPI Watcher] Failed to parse live spec as JSON');
        return;
      }

      const changes = this.diffSpecs(baseline, liveSpec);
      this.changes.set(changes.length > 0 ? changes : null);
    } catch (err) {
      console.warn('[OpenAPI Watcher] Check failed:', err);
    }
  }

  diffSpecs(oldSpec: Record<string, unknown>, newSpec: Record<string, unknown>): OpenApiChange[] {
    const changes: OpenApiChange[] = [];

    const oldPaths = (oldSpec['paths'] as Record<string, unknown>) ?? {};
    const newPaths = (newSpec['paths'] as Record<string, unknown>) ?? {};
    this.diffKeys(oldPaths, newPaths, 'path', changes);

    const oldSchemas = ((oldSpec['components'] as Record<string, unknown>)?.['schemas'] as Record<string, unknown>) ?? {};
    const newSchemas = ((newSpec['components'] as Record<string, unknown>)?.['schemas'] as Record<string, unknown>) ?? {};
    this.diffKeys(oldSchemas, newSchemas, 'schema', changes);

    return changes;
  }

  private diffKeys(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    category: 'path' | 'schema',
    changes: OpenApiChange[],
  ): void {
    const oldKeys = Object.keys(oldObj);
    const newKeys = Object.keys(newObj);
    const oldSet = new Set(oldKeys);
    const newSet = new Set(newKeys);

    for (const key of newKeys) {
      if (!oldSet.has(key)) {
        changes.push({ type: 'added', category, name: key, after: newObj[key] });
      }
    }
    for (const key of oldKeys) {
      if (!newSet.has(key)) {
        changes.push({ type: 'removed', category, name: key, before: oldObj[key] });
      }
    }
    for (const key of newKeys) {
      if (oldSet.has(key)) {
        try {
          if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            changes.push({ type: 'modified', category, name: key, before: oldObj[key], after: newObj[key] });
          }
        } catch {
          changes.push({ type: 'modified', category, name: key, before: oldObj[key], after: newObj[key] });
        }
      }
    }
  }
}
