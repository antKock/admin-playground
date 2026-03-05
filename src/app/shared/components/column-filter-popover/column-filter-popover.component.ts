import { Component, input, output, signal, computed, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';

import { FilterOption } from '../data-table/data-table.component';

@Component({
  selector: 'app-column-filter-popover',
  template: `
    <div class="filter-popover" [style.top.px]="popoverTop()" [style.left.px]="popoverLeft()" (keydown)="onKeydown($event)">
      @if (options().length > 10) {
        <div class="filter-search">
          <input
            type="text"
            class="filter-search-input"
            placeholder="Rechercher..."
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
          />
        </div>
      }
      <div class="filter-options">
        @for (option of filteredOptions(); track option.id) {
          <label class="filter-option">
            <input
              type="checkbox"
              [checked]="isSelected(option.id)"
              (change)="toggleOption(option.id)"
            />
            <span class="filter-option-label">{{ option.label }}</span>
          </label>
        }
        @if (filteredOptions().length === 0) {
          <div class="filter-empty">Aucun résultat</div>
        }
      </div>
      <div class="filter-actions">
        <button class="filter-clear-btn" (click)="onClear()" [disabled]="selected().length === 0">
          Effacer
        </button>
      </div>
    </div>
  `,
  styles: `
    .filter-popover {
      position: fixed;
      z-index: 100;
      min-width: 200px;
      max-width: 300px;
      background: var(--color-surface-base, #fff);
      border: 1px solid var(--color-stroke-standard, #e5e7eb);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-top: 4px;
    }

    .filter-search {
      padding: 8px;
      border-bottom: 1px solid var(--color-stroke-standard, #e5e7eb);
    }

    .filter-search-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--color-stroke-standard, #e5e7eb);
      border-radius: 4px;
      font-size: 13px;
      outline: none;
      background: var(--color-surface-base, #fff);
      color: var(--color-text-primary);
    }

    .filter-search-input:focus {
      border-color: var(--color-brand);
    }

    .filter-options {
      max-height: 200px;
      overflow-y: auto;
      padding: 4px 0;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text-primary);
    }

    .filter-option:hover {
      background: var(--color-surface-table-row-hover, #f9fafb);
    }

    .filter-option input[type="checkbox"] {
      accent-color: var(--color-brand);
    }

    .filter-option-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .filter-empty {
      padding: 12px;
      text-align: center;
      font-size: 13px;
      color: var(--color-text-tertiary);
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
      border-top: 1px solid var(--color-stroke-standard, #e5e7eb);
    }

    .filter-clear-btn {
      padding: 4px 12px;
      font-size: 12px;
      color: var(--color-text-link, #1400cc);
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 4px;
    }

    .filter-clear-btn:hover:not(:disabled) {
      background: var(--color-surface-muted, #f3f4f6);
    }

    .filter-clear-btn:disabled {
      color: var(--color-text-tertiary);
      cursor: default;
    }
  `,
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
