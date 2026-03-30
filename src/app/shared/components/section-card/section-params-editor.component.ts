import { Component, input, output } from '@angular/core';
import { LucideAngularModule, EyeOff, Asterisk, PenOff, Braces, Copy } from 'lucide-angular';
import { ToggleRowComponent } from '../toggle-row/toggle-row.component';
import { RuleFieldComponent } from '../rule-field/rule-field.component';

export interface SectionParams {
  hidden_rule: string;
  required_rule: string;
  disabled_rule: string;
  occurrence_rule: { min: string; max: string };
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

      @if (isAssociation()) {
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
      }

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

      @if (isAssociation()) {
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
                [value]="isCustomRule(params().occurrence_rule.min) ? params().occurrence_rule.min : ''"
                [modelType]="modelType()"
                [modelId]="modelId()"
                (valueChange)="onOccurrenceMinChange($event)"
              />
              <app-rule-field
                placeholder="Max"
                [value]="isCustomRule(params().occurrence_rule.max) ? params().occurrence_rule.max : ''"
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
      }
    </div>
  `,
})
export class SectionParamsEditorComponent {
  readonly params = input.required<SectionParams>();
  readonly isPending = input(false);
  readonly isAssociation = input(false);
  readonly modelType = input<'action' | 'folder' | 'entity' | undefined>(undefined);
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
    return p.occurrence_rule.min !== 'false' || p.occurrence_rule.max !== 'false';
  }

  onOccurrenceToggle(enabled: boolean): void {
    if (enabled) {
      this.paramsChange.emit({
        ...this.params(),
        occurrence_rule: {
          min: this.savedRules['occurrence_rule_min'] ?? 'true',
          max: this.savedRules['occurrence_rule_max'] ?? 'false',
        },
      });
    } else {
      const p = this.params();
      if (this.isCustomRule(p.occurrence_rule.min)) this.savedRules['occurrence_rule_min'] = p.occurrence_rule.min;
      if (this.isCustomRule(p.occurrence_rule.max)) this.savedRules['occurrence_rule_max'] = p.occurrence_rule.max;
      this.paramsChange.emit({
        ...this.params(),
        occurrence_rule: { min: 'false', max: 'false' },
      });
    }
  }

  onOccurrenceMinChange(value: string): void {
    this.paramsChange.emit({
      ...this.params(),
      occurrence_rule: { ...this.params().occurrence_rule, min: value || 'true' },
    });
  }

  onOccurrenceMaxChange(value: string): void {
    this.paramsChange.emit({
      ...this.params(),
      occurrence_rule: { ...this.params().occurrence_rule, max: value || 'true' },
    });
  }
}
