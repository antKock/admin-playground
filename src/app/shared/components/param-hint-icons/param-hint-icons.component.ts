import { Component, input, computed } from '@angular/core';
import { LucideAngularModule, Asterisk, PenOff, Eye, Clipboard, Copy, Braces } from 'lucide-angular';

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
  imports: [LucideAngularModule],
  template: `
    <div class="param-summary">
      @for (hint of hintList(); track hint.label) {
        <span class="param-hint" [class]="hint.stateClass" [title]="hint.tooltip">
          <lucide-icon [img]="hint.icon" [size]="16" />
        </span>
      }
    </div>
  `,
  styles: [`
    .param-summary {
      display: flex;
      gap: 4px;
    }
    .param-hint {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid;
      position: relative;
      cursor: help;
    }
    .param-hint.off {
      background: var(--color-surface-base);
      border-color: var(--color-stroke-standard);
      color: var(--color-text-disabled, #c4c4cc);
    }
    .param-hint.on {
      background: var(--color-brand-light, #f0edff);
      border-color: var(--color-brand, #1400cc);
      color: var(--color-brand, #1400cc);
    }
    .param-hint.on-rule {
      background: var(--color-brand-light, #f0edff);
      border-color: var(--color-brand, #1400cc);
      color: var(--color-brand, #1400cc);
    }
    .param-hint.on-rule::after {
      content: '';
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--color-brand-tertiary, #e84e0f);
      border: 1.5px solid white;
    }
  `],
})
export class ParamHintIconsComponent {
  readonly hints = input<ParamHints>(DEFAULT_HINTS);

  protected readonly icons = {
    required: Asterisk,
    editable: PenOff,
    visibility: Eye,
    defaultValue: Clipboard,
    duplicable: Copy,
    constrained: Braces,
  };

  readonly hintList = computed(() => {
    const h = this.hints();
    return [
      { state: h.required, label: 'required', icon: this.icons.required, tooltip: 'Obligatoire' },
      { state: h.editable, label: 'editable', icon: this.icons.editable, tooltip: 'Non éditable' },
      { state: h.visibility, label: 'visibility', icon: this.icons.visibility, tooltip: 'Masqué' },
      { state: h.defaultValue, label: 'defaultValue', icon: this.icons.defaultValue, tooltip: 'Valeur par défaut' },
      { state: h.duplicable, label: 'duplicable', icon: this.icons.duplicable, tooltip: 'Duplicable' },
      { state: h.constrained, label: 'constrained', icon: this.icons.constrained, tooltip: 'Contrainte' },
    ].map(item => ({
      ...item,
      stateClass: item.state === 'rule' ? 'on-rule' : item.state,
    }));
  });
}
