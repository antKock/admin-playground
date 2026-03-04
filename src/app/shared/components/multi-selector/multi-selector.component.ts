import { Component, ElementRef, inject, input, output, signal, computed } from '@angular/core';

export interface SelectorOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-multi-selector',
  template: `
    <div class="relative">
      <button
        type="button"
        class="w-full px-3 py-2 border rounded-lg text-left bg-surface-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        [class.border-error]="hasError()"
        [class.border-border]="!hasError()"
        [disabled]="loading()"
        (click)="toggleOpen()"
      >
        @if (loading()) {
          <span class="text-text-secondary">Loading...</span>
        } @else if (selectedCount() > 0) {
          <span>{{ selectedCount() }} selected</span>
        } @else {
          <span class="text-text-secondary">{{ placeholder() }}</span>
        }
      </button>

      @if (isOpen()) {
        <div
          class="absolute z-10 mt-1 w-full bg-surface-base border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          @if (options().length === 0) {
            <div class="px-3 py-4 text-sm text-text-secondary text-center">
              No options available
            </div>
          } @else {
            @for (option of options(); track option.id) {
              <label
                class="flex items-center px-3 py-2 hover:bg-surface-muted cursor-pointer text-sm text-text-primary"
              >
                <input
                  type="checkbox"
                  class="rounded border-border text-brand focus:ring-brand"
                  [checked]="isSelected(option.id)"
                  (change)="toggleOption(option.id)"
                />
                <span class="ml-2">{{ option.label }}</span>
              </label>
            }
          }
        </div>
      }

      @if (selectedCount() > 0) {
        <div class="flex flex-wrap gap-1 mt-1">
          @for (id of selectedIds(); track id) {
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-brand/10 text-brand"
            >
              {{ getLabel(id) }}
              <button
                type="button"
                class="ml-1 hover:text-brand-hover"
                (click)="removeOption(id); $event.stopPropagation()"
              >
                &times;
              </button>
            </span>
          }
        </div>
      }
    </div>
  `,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class MultiSelectorComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly options = input.required<SelectorOption[]>();
  readonly selectedIds = input.required<string[]>();
  readonly placeholder = input('Select...');
  readonly loading = input(false);
  readonly hasError = input(false);

  readonly selectionChange = output<string[]>();

  readonly isOpen = signal(false);
  readonly selectedCount = computed(() => this.selectedIds().length);

  toggleOpen(): void {
    if (!this.loading()) {
      this.isOpen.update((v) => !v);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  getLabel(id: string): string {
    return this.options().find((o) => o.id === id)?.label ?? id;
  }

  toggleOption(id: string): void {
    const current = this.selectedIds();
    const next = this.isSelected(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    this.selectionChange.emit(next);
  }

  removeOption(id: string): void {
    this.selectionChange.emit(this.selectedIds().filter((x) => x !== id));
  }

  onDocumentClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
