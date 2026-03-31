import { Component, input, output, signal, computed, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { LucideAngularModule, Search, Plus } from 'lucide-angular';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface IndicatorOption {
  id: string;
  name: string;
  technical_label: string;
  type: string;
  children?: { id: string; name: string; technical_label: string; type: string }[];
}

@Component({
  selector: 'app-indicator-picker',
  imports: [StatusBadgeComponent, LucideAngularModule],
  templateUrl: './indicator-picker.component.html',
  styleUrl: './indicator-picker.component.css',
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
      return `${count} résultat${count !== 1 ? 's' : ''} pour « ${term} »`;
    }
    return `${count} indicateur${count !== 1 ? 's' : ''} disponible${count !== 1 ? 's' : ''}`;
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
