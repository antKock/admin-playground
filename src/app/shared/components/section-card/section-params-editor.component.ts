import { Component, input, output } from '@angular/core';
import { LucideAngularModule, EyeOff, Asterisk, PenOff, Braces } from 'lucide-angular';
import { ToggleRowComponent } from '../toggle-row/toggle-row.component';

export interface SectionParams {
  hidden_rule: string;
  required_rule: string;
  disabled_rule: string;
  occurrence_min_rule: string;
  occurrence_max_rule: string;
  constrained_rule: string;
}

@Component({
  selector: 'app-section-params-editor',
  imports: [ToggleRowComponent, LucideAngularModule],
  template: `
    <div class="space-y-1">
      <app-toggle-row
        label="Masqué"
        [icon]="EyeOff"
        [enabled]="isOverridden(params().hidden_rule)"
        (toggled)="onToggle('hidden_rule', $event)"
      />
      <app-toggle-row
        label="Obligatoire"
        [icon]="Asterisk"
        [enabled]="isOverridden(params().required_rule)"
        (toggled)="onToggle('required_rule', $event)"
      />
      <app-toggle-row
        label="Non éditable"
        [icon]="PenOff"
        [enabled]="isOverridden(params().disabled_rule)"
        (toggled)="onToggle('disabled_rule', $event)"
      />
      <app-toggle-row
        label="Contrainte"
        [icon]="Braces"
        [enabled]="isOverridden(params().constrained_rule)"
        (toggled)="onToggle('constrained_rule', $event)"
      />
    </div>
  `,
})
export class SectionParamsEditorComponent {
  readonly params = input.required<SectionParams>();
  readonly isPending = input(false);
  readonly paramsChange = output<SectionParams>();

  protected readonly EyeOff = EyeOff;
  protected readonly Asterisk = Asterisk;
  protected readonly PenOff = PenOff;
  protected readonly Braces = Braces;

  isOverridden(value: string): boolean {
    return value !== 'false';
  }

  onToggle(field: keyof SectionParams, enabled: boolean): void {
    this.paramsChange.emit({
      ...this.params(),
      [field]: enabled ? 'true' : 'false',
    });
  }
}
