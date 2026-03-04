import { Component, input, computed } from '@angular/core';

export type ParamState = 'off' | 'on' | 'rule';

export interface ParamHints {
  visibility: ParamState;
  required: ParamState;
  editable: ParamState;
  defaultValue: ParamState;
  duplicable: ParamState;
  constrained: ParamState;
}

const DEFAULT_HINTS: ParamHints = {
  visibility: 'off',
  required: 'off',
  editable: 'off',
  defaultValue: 'off',
  duplicable: 'off',
  constrained: 'off',
};

@Component({
  selector: 'app-param-hint-icons',
  template: `
    <div class="flex items-center gap-1" [title]="tooltip()">
      @for (hint of hintList(); track $index) {
        <span class="relative inline-block w-2 h-2 rounded-full"
          [class.bg-brand]="hint.state !== 'off'"
          [class.bg-surface-muted]="hint.state === 'off'"
        >
          @if (hint.state === 'rule') {
            <span class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          }
        </span>
      }
    </div>
  `,
})
export class ParamHintIconsComponent {
  readonly hints = input<ParamHints>(DEFAULT_HINTS);

  readonly hintList = computed(() => {
    const h = this.hints();
    return [
      { state: h.visibility, label: 'visibility' },
      { state: h.required, label: 'required' },
      { state: h.editable, label: 'editable' },
      { state: h.defaultValue, label: 'default value' },
      { state: h.duplicable, label: 'duplicable' },
      { state: h.constrained, label: 'constrained' },
    ];
  });

  readonly tooltip = computed(() => {
    const configured = this.hintList().filter((h) => h.state !== 'off');
    if (configured.length === 0) return 'All parameters at defaults';
    return `Configured: ${configured.map((h) => {
      const suffix = h.state === 'rule' ? ' (rule)' : '';
      return h.label + suffix;
    }).join(', ')}`;
  });
}
