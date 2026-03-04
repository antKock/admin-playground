import { Component, input, output, signal, computed, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { LucideAngularModule, Search, Plus } from 'lucide-angular';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface IndicatorOption {
  id: string;
  name: string;
  technical_label: string;
  type: string;
}

@Component({
  selector: 'app-indicator-picker',
  imports: [StatusBadgeComponent, LucideAngularModule],
  template: `
    <!-- CTA Button -->
    <div class="add-indicator-cta" [class.open]="isOpen()" (click)="!isOpen() && open()">
      <lucide-icon [img]="PlusIcon" [size]="16" />
      Attach an indicator
    </div>

    <!-- Picker Panel -->
    @if (isOpen()) {
      <div class="indicator-picker">
        <div class="indicator-picker-search">
          <lucide-icon [img]="SearchIcon" [size]="14" style="color: var(--color-text-tertiary);" />
          <input
            #searchInput
            type="text"
            placeholder="Search indicators by name or technical name..."
            (input)="onSearchInput($event)"
            (keydown.escape)="close()"
          />
        </div>
        <div class="indicator-picker-list">
          @for (indicator of filtered(); track indicator.id) {
            @if (isAttached(indicator.id)) {
              <div class="indicator-picker-item already-attached">
                <div class="indicator-picker-item-left">
                  <span class="indicator-picker-name">{{ indicator.name }}</span>
                  <span class="indicator-picker-meta">
                    {{ indicator.technical_label }}
                    <app-status-badge [status]="indicator.type" />
                  </span>
                </div>
                <div class="indicator-picker-item-right">Already attached</div>
              </div>
            } @else {
              <button class="indicator-picker-item" (click)="onAttach(indicator)">
                <div class="indicator-picker-item-left">
                  <span class="indicator-picker-name">{{ indicator.name }}</span>
                  <span class="indicator-picker-meta">
                    {{ indicator.technical_label }}
                    <app-status-badge [status]="indicator.type" />
                  </span>
                </div>
                <div class="indicator-picker-item-right">+ Attach</div>
              </button>
            }
          }
          @if (filtered().length === 0) {
            <div class="indicator-picker-item" style="justify-content: center; color: var(--color-text-secondary);">
              No indicators found
            </div>
          }
        </div>
        <div class="indicator-picker-footer">
          <span>{{ footerLabel() }}</span>
          <span style="color: var(--color-text-disabled, #c4c4cc);">Esc to close</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .add-indicator-cta {
      border: 2px dashed var(--color-stroke-medium, #d1d1d8);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      color: var(--color-text-tertiary);
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s;
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .add-indicator-cta:hover {
      border-color: var(--color-brand, #1400cc);
      color: var(--color-brand, #1400cc);
      background: var(--color-surface-active, #f0edff);
    }
    .add-indicator-cta.open {
      border-color: var(--color-brand, #1400cc);
      color: var(--color-brand, #1400cc);
      background: var(--color-surface-active, #f0edff);
      border-style: solid;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      margin-bottom: 0;
    }

    .indicator-picker {
      border: 1px solid var(--color-stroke-standard);
      border-top: none;
      border-radius: 0 0 8px 8px;
      background: var(--color-surface-base);
      overflow: hidden;
    }
    .indicator-picker-search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--color-stroke-standard);
    }
    .indicator-picker-search input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      color: var(--color-text-primary);
      background: transparent;
    }
    .indicator-picker-search input::placeholder {
      color: var(--color-text-tertiary);
    }

    .indicator-picker-list {
      max-height: 240px;
      overflow-y: auto;
    }
    .indicator-picker-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid var(--color-stroke-standard);
      cursor: pointer;
      width: 100%;
      background: none;
      border-left: none;
      border-right: none;
      border-top: none;
      text-align: left;
    }
    .indicator-picker-item:last-child {
      border-bottom: none;
    }
    .indicator-picker-item:hover:not(.already-attached) {
      background: var(--color-surface-muted);
    }
    .indicator-picker-item.already-attached {
      opacity: 0.5;
      cursor: default;
    }

    .indicator-picker-item-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .indicator-picker-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }
    .indicator-picker-meta {
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 12px;
      color: var(--color-text-tertiary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .indicator-picker-item-right {
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .indicator-picker-item:not(.already-attached) .indicator-picker-item-right {
      color: var(--color-brand, #1400cc);
      font-weight: 600;
    }

    .indicator-picker-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      font-size: 12px;
      color: var(--color-text-secondary);
      border-top: 1px solid var(--color-stroke-standard);
      background: var(--color-surface-subtle, #fafafa);
    }
  `],
})
export class IndicatorPickerComponent implements OnDestroy {
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly options = input.required<IndicatorOption[]>();
  readonly attachedIds = input<string[]>([]);
  readonly loading = input(false);

  readonly attach = output<IndicatorOption>();

  readonly isOpen = signal(false);
  readonly searchTerm = signal('');

  protected readonly SearchIcon = Search;
  protected readonly PlusIcon = Plus;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly filtered = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.options().filter(
      (o) =>
        o.name.toLowerCase().includes(term) ||
        o.technical_label.toLowerCase().includes(term),
    );
  });

  readonly footerLabel = computed(() => {
    const term = this.searchTerm();
    const count = this.filtered().filter(o => !this.isAttached(o.id)).length;
    if (term) {
      return `${count} result${count !== 1 ? 's' : ''} matching "${term}"`;
    }
    return `${count} indicator${count !== 1 ? 's' : ''} available`;
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
