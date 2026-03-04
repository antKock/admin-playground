import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-save-bar',
  template: `
    @if (count() > 0) {
      <div
        class="fixed bottom-0 left-60 right-0 bg-surface-base border-t border-border px-6 py-3 flex items-center justify-between shadow-lg z-40"
      >
        <div class="flex items-center gap-2 text-amber-600">
          <span class="text-sm font-medium">{{ count() }} unsaved change{{ count() > 1 ? 's' : '' }}</span>
        </div>
        <div class="flex gap-3">
          <button
            class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-muted transition-colors"
            [disabled]="saving()"
            (click)="discard.emit()"
          >
            Discard
          </button>
          <button
            class="px-4 py-2 text-sm bg-brand text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            [disabled]="saving()"
            (click)="save.emit()"
          >
            {{ saving() ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    }
  `,
})
export class SaveBarComponent {
  readonly count = input.required<number>();
  readonly saving = input(false);
  readonly save = output<void>();
  readonly discard = output<void>();
}
