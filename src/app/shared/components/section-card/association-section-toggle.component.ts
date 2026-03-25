import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-association-section-toggle',
  template: `
    <button
      type="button"
      class="relative w-11 h-6 rounded-full cursor-pointer transition-colors border-none p-0 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      role="switch"
      [attr.aria-checked]="enabled()"
      [attr.aria-label]="'Activer la section'"
      [class]="enabled() ? 'bg-brand' : 'bg-gray-300'"
      [disabled]="isPending()"
      (click)="$event.stopPropagation(); toggled.emit()"
    >
      <span
        class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm"
        [class.translate-x-5]="enabled()"
      ></span>
    </button>
  `,
})
export class AssociationSectionToggleComponent {
  readonly enabled = input(false);
  readonly isPending = input(false);
  readonly toggled = output<void>();
}
