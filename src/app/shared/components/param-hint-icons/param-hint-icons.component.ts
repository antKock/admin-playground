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
          <lucide-icon [img]="hint.icon" [size]="12" />
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
      width: 26px;
      height: 26px;
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
      { state: h.required, label: 'required', icon: this.icons.required, tooltip: `Required: ${this.stateLabel(h.required)}` },
      { state: h.editable, label: 'editable', icon: this.icons.editable, tooltip: `Editable: ${this.stateLabel(h.editable)}` },
      { state: h.visibility, label: 'visibility', icon: this.icons.visibility, tooltip: `Visible: ${this.stateLabel(h.visibility)}` },
      { state: h.defaultValue, label: 'defaultValue', icon: this.icons.defaultValue, tooltip: `Default value: ${this.stateLabel(h.defaultValue)}` },
      { state: h.duplicable, label: 'duplicable', icon: this.icons.duplicable, tooltip: `Duplicable: ${this.stateLabel(h.duplicable)}` },
      { state: h.constrained, label: 'constrained', icon: this.icons.constrained, tooltip: `Constraints: ${this.stateLabel(h.constrained)}` },
    ].map(item => ({
      ...item,
      stateClass: item.state === 'rule' ? 'on-rule' : item.state,
    }));
  });

  private stateLabel(state: ParamState): string {
    if (state === 'off') return 'OFF';
    if (state === 'on') return 'ON';
    return 'ON + JSONLogic rule';
  }
}
