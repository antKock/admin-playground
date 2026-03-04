import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-toggle-row',
  template: `
    <div class="flex items-center justify-between py-2">
      <div class="flex items-center gap-2">
        <span class="text-sm text-text-secondary">{{ label() }}</span>
      </div>
      <button
        type="button"
        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
        [class.bg-brand]="enabled()"
        [class.bg-surface-muted]="!enabled()"
        (click)="toggle.emit(!enabled())"
      >
        <span
          class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm"
          [class.translate-x-4]="enabled()"
          [class.translate-x-0.5]="!enabled()"
        ></span>
      </button>
    </div>
  `,
})
export class ToggleRowComponent {
  readonly label = input.required<string>();
  readonly enabled = input(false);
  readonly toggle = output<boolean>();
}
