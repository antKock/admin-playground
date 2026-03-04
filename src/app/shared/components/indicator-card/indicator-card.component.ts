import { Component, input, output, signal } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ParamHintIconsComponent, ParamHints } from '../param-hint-icons/param-hint-icons.component';
import { ToggleRowComponent } from '../toggle-row/toggle-row.component';
import { RuleFieldComponent } from '../rule-field/rule-field.component';

export interface IndicatorCardData {
  id: string;
  name: string;
  technical_label?: string;
  type: string;
  paramHints: ParamHints;
}

export interface IndicatorParams {
  visibility_rule: string;
  required_rule: string;
  editable_rule: string;
  default_value_rule: string | null;
  duplicable: { enabled: boolean; min_count: number | null; max_count: number | null } | null;
  constrained_values: { enabled: boolean; min_value: number | null; max_value: number | null } | null;
}

@Component({
  selector: 'app-indicator-card',
  imports: [StatusBadgeComponent, ParamHintIconsComponent, ToggleRowComponent, RuleFieldComponent, CdkDragHandle],
  template: `
    <div
      class="group border rounded-lg bg-surface-base transition-colors"
      [class.border-border]="!modified()"
      [class.border-l-4]="modified()"
      [class.border-l-amber-400]="modified()"
    >
      <!-- Header -->
      <div class="flex items-center gap-3 px-3 py-2">
        <span cdkDragHandle class="cursor-grab text-text-secondary hover:text-text-primary">
          &#x2261;
        </span>
        <button
          class="flex-1 min-w-0 text-left"
          (click)="expanded.set(!expanded())"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs text-text-secondary">{{ expanded() ? '&#x25BC;' : '&#x25B6;' }}</span>
            <span class="text-sm font-medium text-text-primary truncate">{{ indicator().name }}</span>
            @if (indicator().technical_label) {
              <span class="text-xs text-text-secondary truncate">{{ indicator().technical_label }}</span>
            }
            <app-status-badge [status]="indicator().type" />
          </div>
          <app-param-hint-icons [hints]="indicator().paramHints" />
        </button>
        <button
          class="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-status-invalid transition-opacity text-lg"
          title="Remove indicator"
          (click)="remove.emit(indicator().id)"
        >
          &times;
        </button>
      </div>

      <!-- Expanded parameter editing -->
      @if (expanded()) {
        <div class="border-t border-border px-4 py-3 space-y-1">
          <!-- Visibility -->
          <app-toggle-row
            label="Visibility"
            [enabled]="params().visibility_rule !== 'false'"
            (toggle)="onVisibilityToggle($event)"
          />
          @if (isCustomRule(params().visibility_rule)) {
            <app-rule-field
              [value]="params().visibility_rule"
              (valueChange)="onRuleChange('visibility_rule', $event)"
            />
          }

          <!-- Required -->
          <app-toggle-row
            label="Required"
            [enabled]="params().required_rule !== 'false'"
            (toggle)="onRequiredToggle($event)"
          />
          @if (isCustomRule(params().required_rule)) {
            <app-rule-field
              [value]="params().required_rule"
              (valueChange)="onRuleChange('required_rule', $event)"
            />
          }

          <!-- Editable -->
          <app-toggle-row
            label="Editable"
            [enabled]="params().editable_rule !== 'false'"
            (toggle)="onEditableToggle($event)"
          />
          @if (isCustomRule(params().editable_rule)) {
            <app-rule-field
              [value]="params().editable_rule"
              (valueChange)="onRuleChange('editable_rule', $event)"
            />
          }

          <!-- Default Value -->
          <div class="py-2">
            <label class="text-sm text-text-secondary">Default Value</label>
            <input
              type="text"
              class="mt-1 w-full px-3 py-1.5 border border-border rounded-lg text-sm text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
              [value]="params().default_value_rule ?? ''"
              placeholder="No default"
              (input)="onDefaultValueChange($event)"
            />
          </div>

          <!-- Duplicable -->
          <app-toggle-row
            label="Duplicable"
            [enabled]="params().duplicable?.enabled ?? false"
            (toggle)="onDuplicableToggle($event)"
          />
          @if (params().duplicable?.enabled) {
            <div class="flex gap-4 pl-4 pb-2">
              <div>
                <label class="text-xs text-text-secondary">Min count</label>
                <input
                  type="number"
                  min="0"
                  class="mt-0.5 w-20 px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
                  [value]="params().duplicable?.min_count ?? ''"
                  (input)="onDuplicableMinChange($event)"
                />
              </div>
              <div>
                <label class="text-xs text-text-secondary">Max count</label>
                <input
                  type="number"
                  min="0"
                  class="mt-0.5 w-20 px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
                  [value]="params().duplicable?.max_count ?? ''"
                  (input)="onDuplicableMaxChange($event)"
                />
              </div>
            </div>
          }

          <!-- Constrained Values -->
          <app-toggle-row
            label="Constraints"
            [enabled]="params().constrained_values?.enabled ?? false"
            (toggle)="onConstrainedToggle($event)"
          />
          @if (params().constrained_values?.enabled) {
            <div class="flex gap-4 pl-4 pb-2">
              <div>
                <label class="text-xs text-text-secondary">Min value</label>
                <input
                  type="number"
                  min="0"
                  class="mt-0.5 w-20 px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
                  [value]="params().constrained_values?.min_value ?? ''"
                  (input)="onConstrainedMinChange($event)"
                />
              </div>
              <div>
                <label class="text-xs text-text-secondary">Max value</label>
                <input
                  type="number"
                  min="0"
                  class="mt-0.5 w-20 px-2 py-1 border border-border rounded text-sm text-text-primary bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand"
                  [value]="params().constrained_values?.max_value ?? ''"
                  (input)="onConstrainedMaxChange($event)"
                />
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class IndicatorCardComponent {
  readonly indicator = input.required<IndicatorCardData>();
  readonly params = input.required<IndicatorParams>();
  readonly modified = input(false);

  readonly remove = output<string>();
  readonly paramsChange = output<IndicatorParams>();

  readonly expanded = signal(false);

  // Preserve custom JSONLogic rules when toggling off so they can be restored on toggle back on
  private savedRules: Record<string, string> = {};

  private emitParams(partial: Partial<IndicatorParams>): void {
    this.paramsChange.emit({ ...this.params(), ...partial });
  }

  isCustomRule(value: string): boolean {
    return value !== 'true' && value !== 'false';
  }

  onRuleChange(field: 'visibility_rule' | 'required_rule' | 'editable_rule', value: string): void {
    this.emitParams({ [field]: value || (field === 'required_rule' ? 'false' : 'true') });
  }

  private toggleRule(field: 'visibility_rule' | 'required_rule' | 'editable_rule', enabled: boolean, offDefault: string): void {
    const current = this.params()[field];
    if (!enabled && this.isCustomRule(current)) {
      this.savedRules[field] = current;
    }
    const onValue = this.savedRules[field] ?? (offDefault === 'false' ? 'true' : 'true');
    this.emitParams({ [field]: enabled ? onValue : offDefault });
  }

  onVisibilityToggle(enabled: boolean): void {
    this.toggleRule('visibility_rule', enabled, 'false');
  }

  onRequiredToggle(enabled: boolean): void {
    this.toggleRule('required_rule', enabled, 'false');
  }

  onEditableToggle(enabled: boolean): void {
    this.toggleRule('editable_rule', enabled, 'false');
  }

  onDefaultValueChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emitParams({ default_value_rule: value || null });
  }

  onDuplicableToggle(enabled: boolean): void {
    this.emitParams({
      duplicable: enabled
        ? { enabled: true, min_count: null, max_count: null }
        : null,
    });
  }

  onDuplicableMinChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const current = this.params().duplicable;
    this.emitParams({
      duplicable: {
        enabled: true,
        min_count: value ? Number(value) : null,
        max_count: current?.max_count ?? null,
      },
    });
  }

  onDuplicableMaxChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const current = this.params().duplicable;
    this.emitParams({
      duplicable: {
        enabled: true,
        min_count: current?.min_count ?? null,
        max_count: value ? Number(value) : null,
      },
    });
  }

  onConstrainedToggle(enabled: boolean): void {
    this.emitParams({
      constrained_values: enabled
        ? { enabled: true, min_value: null, max_value: null }
        : null,
    });
  }

  onConstrainedMinChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const current = this.params().constrained_values;
    this.emitParams({
      constrained_values: {
        enabled: true,
        min_value: value ? Number(value) : null,
        max_value: current?.max_value ?? null,
      },
    });
  }

  onConstrainedMaxChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const current = this.params().constrained_values;
    this.emitParams({
      constrained_values: {
        enabled: true,
        min_value: current?.min_value ?? null,
        max_value: value ? Number(value) : null,
      },
    });
  }
}
