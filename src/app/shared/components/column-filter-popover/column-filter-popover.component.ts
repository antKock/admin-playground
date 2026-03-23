import { Component, input, output, signal, computed, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';

import { FilterOption } from '../data-table/data-table.component';

@Component({
  selector: 'app-column-filter-popover',
  templateUrl: './column-filter-popover.component.html',
  styleUrl: './column-filter-popover.component.css',
})
export class ColumnFilterPopoverComponent implements OnInit, OnDestroy {
  readonly options = input.required<FilterOption[]>();
  readonly selected = input<string[]>([]);
  readonly selectionChange = output<string[]>();
  readonly closePopover = output<void>();

  readonly searchTerm = signal('');
  readonly popoverTop = signal(0);
  readonly popoverLeft = signal(0);
  private readonly el = inject(ElementRef);
  private outsideClickHandler = this.handleOutsideClick.bind(this);
  private scrollHandler = this.handleScroll.bind(this);
  private resizeHandler = this.handleResize.bind(this);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      document.addEventListener('click', this.outsideClickHandler);
    });
  }

  ngOnInit(): void {
    this.updatePosition();
    window.addEventListener('scroll', this.scrollHandler, true);
    window.addEventListener('resize', this.resizeHandler);
  }

  private updatePosition(): void {
    const parentTh = this.el.nativeElement.closest('th');
    if (parentTh) {
      const rect = parentTh.getBoundingClientRect();
      this.popoverTop.set(rect.bottom + 4);
      this.popoverLeft.set(rect.left);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }
    document.removeEventListener('click', this.outsideClickHandler);
    window.removeEventListener('scroll', this.scrollHandler, true);
    window.removeEventListener('resize', this.resizeHandler);
  }

  readonly filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.options();
    return this.options().filter(o => o.label.toLowerCase().includes(term));
  });

  isSelected(id: string): boolean {
    return this.selected().includes(id);
  }

  toggleOption(id: string): void {
    const current = this.selected();
    const next = current.includes(id)
      ? current.filter(v => v !== id)
      : [...current, id];
    this.selectionChange.emit(next);
  }

  onClear(): void {
    this.selectionChange.emit([]);
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closePopover.emit();
    }
  }

  private handleResize(): void {
    this.closePopover.emit();
  }

  private handleScroll(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closePopover.emit();
    }
  }

  private handleOutsideClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closePopover.emit();
    }
  }
}
