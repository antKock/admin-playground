import { Component, ElementRef, input, output, AfterViewInit, OnDestroy, viewChild, signal, computed } from '@angular/core';
import { LucideAngularModule, type LucideIconData } from 'lucide-angular';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { formatDateFr } from '@app/shared/utils/format-date';

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  type?: 'text' | 'status-badge' | 'date' | 'dual-line' | 'link';
  sortable?: boolean;
  secondaryKey?: string;
  linkRoute?: string;
  linkIdKey?: string;
}

export interface RowAction {
  label: string;
  icon?: LucideIconData;
  variant?: 'default' | 'danger';
  handler: string;
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
  imports: [StatusBadgeComponent, LucideAngularModule],
})
export class DataTableComponent implements AfterViewInit, OnDestroy {
  readonly columns = input.required<ColumnDef[]>();
  readonly data = input.required<Record<string, unknown>[]>();
  readonly isLoading = input(false);
  readonly hasMore = input(false);
  readonly actions = input<RowAction[]>([]);

  readonly rowClick = output<Record<string, unknown>>();
  readonly loadMore = output<void>();
  readonly actionClick = output<{ action: string; row: Record<string, unknown> }>();
  readonly linkClick = output<{ route: string; id: string }>();

  readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');

  readonly sortColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc' | null>(null);

  readonly sortedData = computed(() => {
    const items = this.data();
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col || !dir) return items;

    return [...items].sort((a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal, 'fr');
      } else {
        cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return dir === 'desc' ? -cmp : cmp;
    });
  });

  private observer: IntersectionObserver | null = null;
  private sentinel: HTMLElement | null = null;

  readonly skeletonRows = Array(6).fill(0);

  ngAfterViewInit(): void {
    this.setupInfiniteScroll();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onSortClick(col: ColumnDef): void {
    if (!col.sortable) return;
    if (this.sortColumn() === col.key) {
      const current = this.sortDirection();
      if (current === 'asc') {
        this.sortDirection.set('desc');
      } else if (current === 'desc') {
        this.sortColumn.set(null);
        this.sortDirection.set(null);
      }
    } else {
      this.sortColumn.set(col.key);
      this.sortDirection.set('asc');
    }
  }

  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }

  onRowKeydown(event: KeyboardEvent, row: Record<string, unknown>): void {
    if (event.key === 'Enter') {
      this.rowClick.emit(row);
    }
  }

  onActionClick(event: Event, action: RowAction, row: Record<string, unknown>): void {
    event.stopPropagation();
    this.actionClick.emit({ action: action.handler, row });
  }

  onLinkClick(event: Event, col: ColumnDef, row: Record<string, unknown>): void {
    event.stopPropagation();
    if (col.linkRoute && col.linkIdKey) {
      const id = row[col.linkIdKey];
      if (typeof id === 'string') {
        this.linkClick.emit({ route: col.linkRoute, id });
      }
    }
  }

  hasLinkTarget(row: Record<string, unknown>, col: ColumnDef): boolean {
    return !!col.linkIdKey && typeof row[col.linkIdKey] === 'string';
  }

  getCellValue(row: Record<string, unknown>, key: string): unknown {
    return row[key];
  }

  formatDate(value: unknown): string {
    if (!value || typeof value !== 'string') return '—';
    return formatDateFr(value);
  }

  private setupInfiniteScroll(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    this.sentinel = container.querySelector('.scroll-sentinel');
    if (!this.sentinel) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore() && !this.isLoading()) {
          this.loadMore.emit();
        }
      },
      { root: container, rootMargin: '0px 0px 20% 0px', threshold: 0 },
    );

    this.observer.observe(this.sentinel);
  }
}
