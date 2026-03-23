import { Component, ElementRef, inject, input, output, signal, computed } from '@angular/core';

export interface SelectorOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-multi-selector',
  templateUrl: './multi-selector.component.html',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class MultiSelectorComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly options = input.required<SelectorOption[]>();
  readonly selectedIds = input.required<string[]>();
  readonly placeholder = input('Sélectionner...');
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
