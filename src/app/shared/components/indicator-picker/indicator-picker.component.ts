import { Component, input, output, signal, computed, ViewChild, ElementRef, OnDestroy } from '@angular/core';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface IndicatorOption {
  id: string;
  name: string;
  technical_label: string;
  type: string;
}

@Component({
  selector: 'app-indicator-picker',
  imports: [StatusBadgeComponent],
  template: `
    @if (!isOpen()) {
      <button
        class="w-full py-3 border-2 border-dashed border-border rounded-lg text-text-secondary hover:border-brand hover:text-brand transition-colors text-sm"
        (click)="open()"
      >
        + Attach indicator
      </button>
    } @else {
      <div class="border border-border rounded-lg bg-surface-base p-3 space-y-2">
        <input
          #searchInput
          type="text"
          placeholder="Search indicators..."
          class="w-full px-3 py-2 border border-border rounded-lg text-text-primary bg-surface-base text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          (input)="onSearchInput($event)"
          (keydown.escape)="close()"
        />
        <div class="max-h-48 overflow-y-auto space-y-1">
          @for (indicator of filtered(); track indicator.id) {
            @if (isAttached(indicator.id)) {
              <div class="flex items-center justify-between px-3 py-2 rounded-lg opacity-50">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-text-primary">{{ indicator.name }}</span>
                  <app-status-badge [status]="indicator.type" />
                </div>
                <span class="text-xs text-text-secondary">Already attached</span>
              </div>
            } @else {
              <button
                class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-muted transition-colors"
                (click)="onAttach(indicator)"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm text-text-primary">{{ indicator.name }}</span>
                  <app-status-badge [status]="indicator.type" />
                </div>
                <span class="text-xs text-brand font-medium">+ Attach</span>
              </button>
            }
          }
          @if (filtered().length === 0) {
            <p class="text-sm text-text-secondary text-center py-2">No indicators found</p>
          }
        </div>
        <button
          class="text-xs text-text-secondary hover:text-text-primary"
          (click)="close()"
        >
          Close
        </button>
      </div>
    }
  `,
})
export class IndicatorPickerComponent implements OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly options = input.required<IndicatorOption[]>();
  readonly attachedIds = input<string[]>([]);
  readonly loading = input(false);

  readonly attach = output<IndicatorOption>();

  readonly isOpen = signal(false);
  readonly searchTerm = signal('');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.options().filter(
      (o) =>
        o.name.toLowerCase().includes(term) ||
        o.technical_label.toLowerCase().includes(term),
    );
  });

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  isAttached(id: string): boolean {
    return this.attachedIds().includes(id);
  }

  open(): void {
    this.isOpen.set(true);
    this.searchTerm.set('');
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  close(): void {
    this.isOpen.set(false);
    this.searchTerm.set('');
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchTerm.set(value);
    }, 300);
  }

  onAttach(indicator: IndicatorOption): void {
    this.attach.emit(indicator);
    this.close();
  }
}
