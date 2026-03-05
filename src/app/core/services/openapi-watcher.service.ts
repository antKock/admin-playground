import { Injectable, signal } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface OpenApiChange {
  type: 'added' | 'removed' | 'modified';
  category: 'path' | 'schema';
  name: string;
}

const STORAGE_KEY_HASH = 'openapi-baseline-hash';
const STORAGE_KEY_DISMISSED = 'openapi-dismissed-hash';

@Injectable({ providedIn: 'root' })
export class OpenApiWatcherService {
  readonly changes = signal<OpenApiChange[] | null>(null);
  readonly currentHash = signal<string | null>(null);
  private baselineSpec: Record<string, unknown> | null = null;
  private pendingSpec: Record<string, unknown> | null = null;

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
      const newHash = await this.hashSha256(specText);
      this.currentHash.set(newHash);

      let newSpec: Record<string, unknown>;
      try {
        newSpec = JSON.parse(specText);
      } catch {
        console.warn('[OpenAPI Watcher] Failed to parse spec as JSON');
        return;
      }

      const storedHash = localStorage.getItem(STORAGE_KEY_HASH);

      // First run — save baseline, no warning
      if (!storedHash) {
        localStorage.setItem(STORAGE_KEY_HASH, newHash);
        this.baselineSpec = newSpec;
        return;
      }

      // Same hash — no change (keep baseline in memory if missing)
      if (storedHash === newHash) {
        if (!this.baselineSpec) {
          this.baselineSpec = newSpec;
        }
        return;
      }

      // Check if dismissed for this hash
      const dismissedHash = localStorage.getItem(STORAGE_KEY_DISMISSED);
      if (dismissedHash === newHash) {
        return;
      }

      // Hash differs — compute diff if baseline is available
      if (this.baselineSpec) {
        const changes = this.diffSpecs(this.baselineSpec, newSpec);
        this.changes.set(changes.length > 0 ? changes : [{ type: 'modified', category: 'schema', name: '(changement détecté)' }]);
      } else {
        // No in-memory baseline (first page load after a spec change) — show generic change
        this.changes.set([{ type: 'modified', category: 'schema', name: '(spec modifiée — recharger pour voir le détail)' }]);
      }

      // Keep the new spec for dismiss() to update the baseline
      this.pendingSpec = newSpec;
    } catch (err) {
      console.warn('[OpenAPI Watcher] Check failed:', err);
    }
  }

  dismiss(): void {
    const hash = this.currentHash();
    if (hash) {
      localStorage.setItem(STORAGE_KEY_DISMISSED, hash);
      // Update baseline so future checks compare against the new spec
      localStorage.setItem(STORAGE_KEY_HASH, hash);
      if (this.pendingSpec) {
        this.baselineSpec = this.pendingSpec;
        this.pendingSpec = null;
      }
    }
    this.changes.set(null);
  }

  async hashSha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
        changes.push({ type: 'added', category, name: key });
      }
    }
    for (const key of oldKeys) {
      if (!newSet.has(key)) {
        changes.push({ type: 'removed', category, name: key });
      }
    }
    for (const key of newKeys) {
      if (oldSet.has(key)) {
        try {
          if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            changes.push({ type: 'modified', category, name: key });
          }
        } catch {
          // Fallback if stringify fails (e.g., circular references)
          changes.push({ type: 'modified', category, name: key });
        }
      }
    }
  }
}
