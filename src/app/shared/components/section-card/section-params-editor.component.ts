import { Component, input, output } from '@angular/core';
import { LucideAngularModule, EyeOff, Asterisk, PenOff, Braces, Copy } from 'lucide-angular';
import { ToggleRowComponent } from '../toggle-row/toggle-row.component';
import { RuleFieldComponent } from '../rule-field/rule-field.component';

export interface SectionParams {
  hidden_rule: string;
  required_rule: string;
  disabled_rule: string;
  occurrence_min_rule: string;
  occurrence_max_rule: string;
  constrained_rule: string;
}

type RuleField = 'hidden_rule' | 'required_rule' | 'disabled_rule' | 'constrained_rule';

@Component({
  selector: 'app-section-params-editor',
  imports: [ToggleRowComponent, RuleFieldComponent, LucideAngularModule],
  template: `
    <div class="space-y-1">
      <!-- Masqué -->
      <div>
        <app-toggle-row
          label="Masqué"
          [icon]="EyeOff"
          [enabled]="isOverridden(params().hidden_rule)"
          (toggled)="onToggle('hidden_rule', $event)"
        />
        @if (isOverridden(params().hidden_rule)) {
          <div class="pl-8 pb-1">
            <app-rule-field
              [value]="isCustomRule(params().hidden_rule) ? params().hidden_rule : ''"
              [modelType]="modelType()"
              [modelId]="modelId()"
              (valueChange)="onRuleChange('hidden_rule', $event)"
            />
          </div>
        }
      </div>

      <!-- Obligatoire -->
      <div>
        <app-toggle-row
          label="Obligatoire"
          [icon]="Asterisk"
          [enabled]="isOverridden(params().required_rule)"
          (toggled)="onToggle('required_rule', $event)"
        />
        @if (isOverridden(params().required_rule)) {
          <div class="pl-8 pb-1">
            <app-rule-field
              [value]="isCustomRule(params().required_rule) ? params().required_rule : ''"
              [modelType]="modelType()"
              [modelId]="modelId()"
              (valueChange)="onRuleChange('required_rule', $event)"
            />
          </div>
        }
      </div>

      <!-- Non éditable -->
      <div>
        <app-toggle-row
          label="Non éditable"
          [icon]="PenOff"
          [enabled]="isOverridden(params().disabled_rule)"
          (toggled)="onToggle('disabled_rule', $event)"
        />
        @if (isOverridden(params().disabled_rule)) {
          <div class="pl-8 pb-1">
            <app-rule-field
              [value]="isCustomRule(params().disabled_rule) ? params().disabled_rule : ''"
              [modelType]="modelType()"
              [modelId]="modelId()"
              (valueChange)="onRuleChange('disabled_rule', $event)"
            />
          </div>
        }
      </div>

      <!-- Occurrences -->
      <div>
        <app-toggle-row
          label="Occurrences"
          [icon]="CopyIcon"
          [enabled]="isOccurrenceOverridden()"
          (toggled)="onOccurrenceToggle($event)"
        />
        @if (isOccurrenceOverridden()) {
          <div class="pl-8 pb-1 flex gap-2">
            <app-rule-field
              placeholder="Min"
              [value]="isCustomRule(params().occurrence_min_rule) ? params().occurrence_min_rule : ''"
              [modelType]="modelType()"
              [modelId]="modelId()"
              (valueChange)="onOccurrenceMinChange($event)"
            />
            <app-rule-field
              placeholder="Max"
              [value]="isCustomRule(params().occurrence_max_rule) ? params().occurrence_max_rule : ''"
              [modelType]="modelType()"
              [modelId]="modelId()"
              (valueChange)="onOccurrenceMaxChange($event)"
            />
          </div>
        }
      </div>

      <!-- Contrainte -->
      <div>
        <app-toggle-row
          label="Contrainte"
          [icon]="Braces"
          [enabled]="isOverridden(params().constrained_rule)"
          (toggled)="onToggle('constrained_rule', $event)"
        />
        @if (isOverridden(params().constrained_rule)) {
          <div class="pl-8 pb-1">
            <app-rule-field
              [value]="isCustomRule(params().constrained_rule) ? params().constrained_rule : ''"
              [modelType]="modelType()"
              [modelId]="modelId()"
              (valueChange)="onRuleChange('constrained_rule', $event)"
            />
          </div>
        }
      </div>
    </div>
  `,
})
export class SectionParamsEditorComponent {
  readonly params = input.required<SectionParams>();
  readonly isPending = input(false);
  readonly modelType = input<'action' | 'folder' | undefined>(undefined);
  readonly modelId = input<string | undefined>(undefined);
  readonly paramsChange = output<SectionParams>();

  protected readonly EyeOff = EyeOff;
  protected readonly Asterisk = Asterisk;
  protected readonly PenOff = PenOff;
  protected readonly Braces = Braces;
  protected readonly CopyIcon = Copy;

  private savedRules: Record<string, string> = {};

  isOverridden(value: string): boolean {
    return value !== 'false';
  }

  isCustomRule(value: string): boolean {
    return value !== 'true' && value !== 'false';
  }

  onToggle(field: RuleField, enabled: boolean): void {
    const current = this.params()[field];
    if (!enabled && this.isCustomRule(current)) {
      this.savedRules[field] = current;
    }
    const onValue = this.savedRules[field] ?? 'true';
    this.paramsChange.emit({
      ...this.params(),
      [field]: enabled ? onValue : 'false',
    });
  }

  onRuleChange(field: RuleField, value: string): void {
    this.paramsChange.emit({
      ...this.params(),
      [field]: value || 'true',
    });
  }

  isOccurrenceOverridden(): boolean {
    const p = this.params();
    return p.occurrence_min_rule !== 'false' || p.occurrence_max_rule !== 'false';
  }

  onOccurrenceToggle(enabled: boolean): void {
    if (enabled) {
      this.paramsChange.emit({
        ...this.params(),
        occurrence_min_rule: this.savedRules['occurrence_min_rule'] ?? 'true',
        occurrence_max_rule: this.savedRules['occurrence_max_rule'] ?? 'false',
      });
    } else {
      const p = this.params();
      if (this.isCustomRule(p.occurrence_min_rule)) this.savedRules['occurrence_min_rule'] = p.occurrence_min_rule;
      if (this.isCustomRule(p.occurrence_max_rule)) this.savedRules['occurrence_max_rule'] = p.occurrence_max_rule;
      this.paramsChange.emit({
        ...this.params(),
        occurrence_min_rule: 'false',
        occurrence_max_rule: 'false',
      });
    }
  }

  onOccurrenceMinChange(value: string): void {
    this.paramsChange.emit({
      ...this.params(),
      occurrence_min_rule: value || 'true',
    });
  }

  onOccurrenceMaxChange(value: string): void {
    this.paramsChange.emit({
      ...this.params(),
      occurrence_max_rule: value || 'true',
    });
  }
}
