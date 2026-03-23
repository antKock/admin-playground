import { Component, input, computed } from '@angular/core';
import { LucideAngularModule, Asterisk, PenOff, Eye, Clipboard, Copy, Braces } from 'lucide-angular';
import { TooltipDirective } from '@shared/directives/tooltip.directive';

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
  imports: [LucideAngularModule, TooltipDirective],
  templateUrl: './param-hint-icons.component.html',
  styleUrl: './param-hint-icons.component.css',
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
