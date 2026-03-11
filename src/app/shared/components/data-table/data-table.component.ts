import { Component, ElementRef, input, output, AfterViewInit, OnDestroy, viewChild, signal, computed } from '@angular/core';
import { LucideAngularModule, ListFilter, type LucideIconData } from 'lucide-angular';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ColumnFilterPopoverComponent } from '../column-filter-popover/column-filter-popover.component';
import { formatDateFr } from '@app/shared/utils/format-date';

export interface FilterOption {
  id: string;
  label: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  type?: 'text' | 'status-badge' | 'date' | 'dual-line' | 'link';
  bold?: boolean;
  sortable?: boolean;
  secondaryKey?: string;
  linkRoute?: string;
  linkIdKey?: string;
  filterable?: boolean;
  filterKey?: string;
  filterOptions?: FilterOption[];
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
  imports: [StatusBadgeComponent, LucideAngularModule, ColumnFilterPopoverComponent],
})
export class DataTableComponent implements AfterViewInit, OnDestroy {
  protected readonly ListFilterIcon = ListFilter;

  readonly columns = input.required<ColumnDef[]>();
  readonly data = input.required<Record<string, unknown>[]>();
  readonly isLoading = input(false);
  readonly hasMore = input(false);
  readonly totalCount = input<number | null>(null);
  readonly actions = input<RowAction[]>([]);
  readonly emptyMessage = input<string | null>(null);

  readonly rowClick = output<Record<string, unknown>>();
  readonly loadMore = output<void>();
  readonly actionClick = output<{ action: string; row: Record<string, unknown> }>();
  readonly linkClick = output<{ route: string; id: string }>();
  readonly filterChange = output<{ key: string; values: string[] }>();
  readonly clearFiltersClick = output<void>();

  readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');

  readonly sortColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc' | null>(null);
  readonly openFilterColumn = signal<string | null>(null);
  readonly activeFilters = signal<Record<string, string[]>>({});

  readonly totalColumns = computed(() => this.columns().length + (this.actions().length > 0 ? 1 : 0));

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

  onFilterIconClick(event: Event, col: ColumnDef): void {
    event.stopPropagation();
    const colKey = col.key;
    this.openFilterColumn.set(this.openFilterColumn() === colKey ? null : colKey);
  }

  onFilterSelectionChange(col: ColumnDef, values: string[]): void {
    const key = col.filterKey || col.key;
    const filters = { ...this.activeFilters() };
    if (values.length === 0) {
      delete filters[key];
    } else {
      filters[key] = values;
    }
    this.activeFilters.set(filters);
    this.filterChange.emit({ key, values });
  }

  getActiveFilterValues(colKey: string): string[] {
    return this.activeFilters()[colKey] ?? [];
  }

  hasActiveFilter(colKey: string): boolean {
    const values = this.activeFilters()[colKey];
    return !!values && values.length > 0;
  }

  hasAnyActiveFilter(): boolean {
    return Object.keys(this.activeFilters()).length > 0;
  }

  onClearFilters(): void {
    this.activeFilters.set({});
    this.openFilterColumn.set(null);
    this.clearFiltersClick.emit();
  }

  closeFilter(): void {
    this.openFilterColumn.set(null);
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

  getLinkHref(col: ColumnDef, row: Record<string, unknown>): string {
    return `${col.linkRoute}/${row[col.linkIdKey!]}`;
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
