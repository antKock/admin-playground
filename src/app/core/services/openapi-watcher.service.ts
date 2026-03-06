import { Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface OpenApiChange {
  type: 'added' | 'removed' | 'modified';
  category: 'path' | 'schema';
  name: string;
  before?: unknown;
  after?: unknown;
}

@Injectable({ providedIn: 'root' })
export class OpenApiWatcherService {
  readonly changes = signal<OpenApiChange[] | null>(null);

  async check(): Promise<void> {
    try {
      const specUrl = `${environment.apiBaseUrl}/openapi.json`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(specUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        console.warn(`[OpenAPI Watcher] Fetch failed with status ${response.status}`);
        return;
      }

      const specText = await response.text();

      let liveSpec: Record<string, unknown>;
      try {
        liveSpec = JSON.parse(specText);
      } catch {
        console.warn('[OpenAPI Watcher] Failed to parse spec as JSON');
        return;
      }

      let baseline: Record<string, unknown>;
      try {
        baseline = (await import('@core/api/generated/openapi-baseline.json')).default as Record<string, unknown>;
      } catch {
        console.warn('[OpenAPI Watcher] Baseline not found — run scripts/generate-api-types.sh');
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
