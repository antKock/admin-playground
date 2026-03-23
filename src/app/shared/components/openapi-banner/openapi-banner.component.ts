import { Component, inject, signal, computed } from '@angular/core';
import { LucideAngularModule, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-angular';

import { OpenApiWatcherService, OpenApiChange } from '@core/api/openapi-watcher.service';

@Component({
  selector: 'app-openapi-banner',
  imports: [LucideAngularModule],
  templateUrl: './openapi-banner.component.html',
  styleUrl: './openapi-banner.component.css',
})
export class OpenApiBannerComponent {
  private readonly watcher = inject(OpenApiWatcherService);

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly ChevronDownIcon = ChevronDown;
  protected readonly ChevronRightIcon = ChevronRight;

  readonly changes = this.watcher.changes;
  readonly isExpanded = signal(false);
  readonly expandedItems = signal<Set<string>>(new Set());

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

  hasDetail(change: OpenApiChange): boolean {
    return change.before != null || change.after != null;
  }

  isDetailExpanded(change: OpenApiChange): boolean {
    return this.expandedItems().has(`${change.category}:${change.name}`);
  }

  toggleDetail(change: OpenApiChange): void {
    const key = `${change.category}:${change.name}`;
    this.expandedItems.update(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
