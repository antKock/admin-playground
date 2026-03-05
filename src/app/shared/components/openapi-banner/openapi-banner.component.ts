import { Component, inject, signal, computed } from '@angular/core';
import { LucideAngularModule, AlertTriangle, ChevronDown } from 'lucide-angular';

import { OpenApiWatcherService, OpenApiChange } from '@app/core/services/openapi-watcher.service';

@Component({
  selector: 'app-openapi-banner',
  imports: [LucideAngularModule],
  template: `
    @if (changes() && changes()!.length > 0) {
      <div class="openapi-banner">
        <button class="openapi-banner-header" (click)="isExpanded.set(!isExpanded())">
          <div class="openapi-banner-title">
            <lucide-icon [img]="AlertTriangleIcon" [size]="16" />
            <span>Le schéma API a changé depuis la dernière synchronisation</span>
          </div>
          <div class="openapi-banner-actions">
            <button
              class="openapi-dismiss-btn"
              (click)="onDismiss(); $event.stopPropagation()"
            >
              Ignorer
            </button>
            <lucide-icon
              [img]="ChevronDownIcon"
              [size]="16"
              class="openapi-chevron"
              [class.rotated]="isExpanded()"
            />
          </div>
        </button>

        @if (isExpanded()) {
          <div class="openapi-banner-body">
            @if (pathChanges().length > 0) {
              <div class="openapi-section">
                <h4 class="openapi-section-title">Endpoints ({{ pathChanges().length }})</h4>
                <ul class="openapi-change-list">
                  @for (change of pathChanges(); track change.name) {
                    <li class="openapi-change-item">
                      <span class="openapi-change-badge" [class]="'badge-' + change.type">{{ changeLabel(change.type) }}</span>
                      <code>{{ change.name }}</code>
                    </li>
                  }
                </ul>
              </div>
            }
            @if (schemaChanges().length > 0) {
              <div class="openapi-section">
                <h4 class="openapi-section-title">Schémas ({{ schemaChanges().length }})</h4>
                <ul class="openapi-change-list">
                  @for (change of schemaChanges(); track change.name) {
                    <li class="openapi-change-item">
                      <span class="openapi-change-badge" [class]="'badge-' + change.type">{{ changeLabel(change.type) }}</span>
                      <code>{{ change.name }}</code>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .openapi-banner {
      background: #fef3c7;
      border-bottom: 1px solid #f59e0b;
      font-size: 13px;
      z-index: 1000;
    }
    .openapi-banner-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 16px;
      cursor: pointer;
      background: none;
      border: none;
      text-align: left;
      color: #92400e;
    }
    .openapi-banner-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    .openapi-banner-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .openapi-dismiss-btn {
      padding: 2px 10px;
      border-radius: 4px;
      border: 1px solid #d97706;
      background: transparent;
      color: #92400e;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
    }
    .openapi-dismiss-btn:hover {
      background: #fde68a;
    }
    .openapi-chevron {
      transition: transform 0.2s;
    }
    .openapi-chevron.rotated {
      transform: rotate(180deg);
    }
    .openapi-banner-body {
      max-height: 300px;
      overflow-y: auto;
      padding: 0 16px 12px;
      border-top: 1px solid #fcd34d;
    }
    .openapi-section {
      margin-top: 8px;
    }
    .openapi-section-title {
      font-size: 12px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 4px;
    }
    .openapi-change-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .openapi-change-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 2px 0;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 12px;
      color: #78350f;
    }
    .openapi-change-badge {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 1px 6px;
      border-radius: 3px;
      min-width: 52px;
      text-align: center;
    }
    .badge-added {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-removed {
      background: #fee2e2;
      color: #991b1b;
    }
    .badge-modified {
      background: #dbeafe;
      color: #1e40af;
    }
  `],
})
export class OpenApiBannerComponent {
  private readonly watcher = inject(OpenApiWatcherService);

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly ChevronDownIcon = ChevronDown;

  readonly changes = this.watcher.changes;
  readonly isExpanded = signal(false);

  readonly pathChanges = computed(() =>
    (this.changes() ?? []).filter(c => c.category === 'path'),
  );

  readonly schemaChanges = computed(() =>
    (this.changes() ?? []).filter(c => c.category === 'schema'),
  );

  changeLabel(type: OpenApiChange['type']): string {
    switch (type) {
      case 'added': return 'Ajouté';
      case 'removed': return 'Supprimé';
      case 'modified': return 'Modifié';
    }
  }

  onDismiss(): void {
    this.watcher.dismiss();
  }
}
