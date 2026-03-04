import { Component, ElementRef, input, output, AfterViewInit, OnDestroy, viewChild } from '@angular/core';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  type?: 'text' | 'status-badge' | 'date';
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
  imports: [StatusBadgeComponent],
})
export class DataTableComponent implements AfterViewInit, OnDestroy {
  readonly columns = input.required<ColumnDef[]>();
  readonly data = input.required<Record<string, unknown>[]>();
  readonly isLoading = input(false);
  readonly hasMore = input(false);

  readonly rowClick = output<Record<string, unknown>>();
  readonly loadMore = output<void>();

  readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');

  private observer: IntersectionObserver | null = null;
  private sentinel: HTMLElement | null = null;

  readonly skeletonRows = Array(6).fill(0);

  ngAfterViewInit(): void {
    this.setupInfiniteScroll();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }

  onRowKeydown(event: KeyboardEvent, row: Record<string, unknown>): void {
    if (event.key === 'Enter') {
      this.rowClick.emit(row);
    }
  }

  getCellValue(row: Record<string, unknown>, key: string): unknown {
    return row[key];
  }

  formatDate(value: unknown): string {
    if (!value || typeof value !== 'string') return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
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
