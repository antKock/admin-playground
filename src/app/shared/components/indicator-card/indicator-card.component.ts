import { Component, input, output, signal } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { LucideAngularModule, GripVertical, ChevronDown, X, Asterisk, PenOff, EyeOff, Clipboard, Copy, Braces } from 'lucide-angular';

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
  visibility_rule: string | null;
  required_rule: string | null;
  editable_rule: string | null;
  default_value_rule: string | null;
  duplicable: { enabled: boolean; min_count: number | null; max_count: number | null } | null;
  constrained_values: { enabled: boolean; min_value: number | null; max_value: number | null } | null;
}

export type RuleField = 'visibility_rule' | 'required_rule' | 'editable_rule';

/** Default values per rule field — used to determine if a toggle is "active" (overridden). */
const RULE_DEFAULTS: Record<RuleField, string> = {
  required_rule: 'false',
  editable_rule: 'true',
  visibility_rule: 'true',
};

/** Returns true when the rule field has been actively configured (overridden from default). */
export function isRuleOverridden(field: RuleField, value: string | null): boolean {
  return value != null && value !== RULE_DEFAULTS[field];
}

@Component({
  selector: 'app-indicator-card',
  imports: [StatusBadgeComponent, ParamHintIconsComponent, ToggleRowComponent, RuleFieldComponent, CdkDragHandle, LucideAngularModule],
  template: `
    <div class="indicator-card"
      [class.expanded]="expanded()"
      [class.unsaved]="modified()"
    >
      <!-- Header -->
      <div class="indicator-card-header" (click)="expanded.set(!expanded())">
        <div class="indicator-card-left">
          <span cdkDragHandle class="drag-handle" title="Drag to reorder" (click)="$event.stopPropagation()">
            <lucide-icon [img]="GripVertical" [size]="16" />
          </span>
          <div>
            <a class="indicator-card-title" [href]="'/indicator-models/' + indicator().id" target="_blank" rel="noopener noreferrer" (click)="$event.stopPropagation()">{{ indicator().name }}</a>
            <div class="indicator-card-technical">
              {{ indicator().technical_label }}
              &nbsp;
              <app-status-badge [status]="indicator().type" />
            </div>
          </div>
        </div>
        <div class="indicator-card-right">
          <app-param-hint-icons [hints]="indicator().paramHints" />
          <button class="remove-indicator-btn" title="Remove from model"
            (click)="$event.stopPropagation(); remove.emit(indicator().id)">
            <lucide-icon [img]="XIcon" [size]="14" />
          </button>
          <span class="expand-icon">
            <lucide-icon [img]="ChevronDown" [size]="18" />
          </span>
        </div>
      </div>

      <!-- Expanded parameter editing -->
      @if (expanded()) {
        <div class="indicator-card-body">
          <!-- Required -->
          <div class="param-section">
            <app-toggle-row
              label="Obligatoire"
              [icon]="AsteriskIcon"
              [enabled]="isOverridden('required_rule')"
              (toggle)="onRequiredToggle($event)"
            />
            @if (isOverridden('required_rule')) {
              <app-rule-field
                [value]="isCustomRule(params().required_rule) ? params().required_rule! : ''"
                (valueChange)="onRuleChange('required_rule', $event)"
              />
            }
          </div>

          <!-- Not Editable -->
          <div class="param-section">
            <app-toggle-row
              label="Non éditable"
              [icon]="PenOffIcon"
              [enabled]="isOverridden('editable_rule')"
              (toggle)="onEditableToggle($event)"
            />
            @if (isOverridden('editable_rule')) {
              <app-rule-field
                [value]="isCustomRule(params().editable_rule) ? params().editable_rule! : ''"
                (valueChange)="onRuleChange('editable_rule', $event)"
              />
            }
          </div>

          <!-- Masqué (Hidden) -->
          <div class="param-section">
            <app-toggle-row
              label="Masqué"
              [icon]="EyeOffIcon"
              [enabled]="isOverridden('visibility_rule')"
              (toggle)="onVisibilityToggle($event)"
            />
            @if (isOverridden('visibility_rule')) {
              <app-rule-field
                [value]="isCustomRule(params().visibility_rule) ? params().visibility_rule! : ''"
                (valueChange)="onRuleChange('visibility_rule', $event)"
              />
            }
          </div>

          <!-- Default Value -->
          <div class="param-section">
            <app-toggle-row
              label="Valeur par défaut"
              [icon]="ClipboardIcon"
              [enabled]="params().default_value_rule != null"
              (toggle)="onDefaultValueToggle($event)"
            />
            @if (params().default_value_rule != null) {
              <div class="default-value-container">
                <input
                  type="text"
                  class="default-value-field"
                  [value]="params().default_value_rule ?? ''"
                  placeholder="Enter default value..."
                  (input)="onDefaultValueChange($event)"
                />
              </div>
            }
          </div>

          <!-- Duplicable -->
          <div class="param-section">
            <app-toggle-row
              label="Duplicable"
              [icon]="CopyIcon"
              [enabled]="params().duplicable?.enabled ?? false"
              (toggle)="onDuplicableToggle($event)"
            />
          </div>

          <!-- Constrained Values -->
          <div class="param-section last">
            <app-toggle-row
              label="Valeurs contraintes"
              [icon]="BracesIcon"
              [enabled]="params().constrained_values?.enabled ?? false"
              (toggle)="onConstrainedToggle($event)"
            />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .indicator-card {
      background: var(--color-surface-subtle, #fafafa);
      border: 1px solid var(--color-stroke-standard);
      border-radius: 8px;
      margin-bottom: 12px;
      transition: all 0.15s;
    }
    .indicator-card.unsaved {
      border-left: 3px solid var(--color-status-unsaved, #e8911a);
      background: var(--color-status-unsaved-bg, #fef6e9);
    }

    .indicator-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
      border-radius: 8px;
    }
    .indicator-card-header:hover {
      background: var(--color-surface-muted);
    }
    .indicator-card.unsaved .indicator-card-header:hover {
      background: #fdecd0;
    }

    .indicator-card-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .drag-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      color: var(--color-text-disabled, #c4c4cc);
      cursor: grab;
    }
    .drag-handle:hover {
      color: var(--color-text-tertiary);
    }

    .indicator-card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-link, #1400cc);
      text-decoration: none;
    }
    .indicator-card-title:hover {
      text-decoration: underline;
    }
    .indicator-card-technical {
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 12px;
      color: var(--color-text-tertiary);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .indicator-card-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .remove-indicator-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: none;
      border: 1px solid transparent;
      color: var(--color-text-disabled, #c4c4cc);
      cursor: pointer;
      opacity: 0;
      transition: all 0.15s;
    }
    .indicator-card:hover .remove-indicator-btn {
      opacity: 1;
    }
    .remove-indicator-btn:hover {
      color: var(--color-text-error, #dc2626);
      border-color: var(--color-text-error, #dc2626);
      background: #fef2f2;
    }

    .expand-icon {
      color: var(--color-text-tertiary);
      transition: transform 0.15s;
      display: flex;
      align-items: center;
    }
    .indicator-card.expanded .expand-icon {
      transform: rotate(180deg);
    }

    .indicator-card-body {
      padding: 0 16px 16px;
      background: var(--color-surface-muted);
      border-top: 1px solid var(--color-stroke-standard);
      border-radius: 0 0 8px 8px;
    }

    .param-section {
      border-bottom: 1px solid var(--color-stroke-standard);
      padding-bottom: 4px;
    }
    .param-section.last,
    .param-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .default-value-container {
      width: 100%;
      margin-top: 12px;
      padding: 12px;
      background: var(--color-surface-base);
      border: 1px solid var(--color-stroke-brand, #1400cc33);
      border-radius: 8px;
    }
    .default-value-field {
      width: 100%;
      padding: 8px 12px;
      background: var(--color-surface-base);
      border: 1px solid var(--color-stroke-standard);
      border-radius: 6px;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 13px;
      color: var(--color-text-primary);
      box-sizing: border-box;
    }
    .default-value-field:focus {
      outline: none;
      border-color: var(--color-brand, #1400cc);
      box-shadow: 0 0 0 3px rgba(20, 0, 204, 0.08);
    }
  `],
})
export class IndicatorCardComponent {
  readonly indicator = input.required<IndicatorCardData>();
  readonly params = input.required<IndicatorParams>();
  readonly modified = input(false);

  readonly remove = output<string>();
  readonly paramsChange = output<IndicatorParams>();

  readonly expanded = signal(false);

  // Icons
  protected readonly GripVertical = GripVertical;
  protected readonly ChevronDown = ChevronDown;
  protected readonly XIcon = X;
  protected readonly AsteriskIcon = Asterisk;
  protected readonly PenOffIcon = PenOff;
  protected readonly EyeOffIcon = EyeOff;
  protected readonly ClipboardIcon = Clipboard;
  protected readonly CopyIcon = Copy;
  protected readonly BracesIcon = Braces;

  // Preserve custom JSONLogic rules when toggling off so they can be restored on toggle back on
  private savedRules: Record<string, string> = {};

  private emitParams(partial: Partial<IndicatorParams>): void {
    this.paramsChange.emit({ ...this.params(), ...partial });
  }

  isOverridden(field: 'visibility_rule' | 'required_rule' | 'editable_rule'): boolean {
    return isRuleOverridden(field, this.params()[field]);
  }

  // Convention: rule values are either 'true'/'false' (boolean sentinels) or a JSONLogic string.
  // 'true'/'false' mean "always on/off"; anything else is a custom JSONLogic rule.
  isCustomRule(value: string | null): boolean {
    return value != null && value !== 'true' && value !== 'false';
  }

  onRuleChange(field: 'visibility_rule' | 'required_rule' | 'editable_rule', value: string): void {
    // If the editor is cleared (empty string), fall back to the "on" value for this override.
    this.emitParams({ [field]: value || this.onValueForField(field) });
  }

  /** The value to store when a toggle is turned ON (the override is activated). */
  private onValueForField(field: 'visibility_rule' | 'required_rule' | 'editable_rule'): string {
    // "Obligatoire" ON → required = 'true'; "Non éditable" ON → editable = 'false'; "Masqué" ON → visible = 'false'
    return field === 'required_rule' ? 'true' : 'false';
  }

  private toggleRule(field: 'visibility_rule' | 'required_rule' | 'editable_rule', enabled: boolean): void {
    const current = this.params()[field];
    if (!enabled && this.isCustomRule(current)) {
      this.savedRules[field] = current!;
    }
    const onValue = this.savedRules[field] ?? this.onValueForField(field);
    // OFF → null (no override). Works today (backend treats null as default) and after backend migration.
    this.emitParams({ [field]: enabled ? onValue : null });
  }

  onVisibilityToggle(enabled: boolean): void {
    this.toggleRule('visibility_rule', enabled);
  }

  onRequiredToggle(enabled: boolean): void {
    this.toggleRule('required_rule', enabled);
  }

  onEditableToggle(enabled: boolean): void {
    this.toggleRule('editable_rule', enabled);
  }

  onDefaultValueToggle(enabled: boolean): void {
    if (enabled) {
      this.emitParams({ default_value_rule: '' });
    } else {
      this.emitParams({ default_value_rule: null });
    }
  }

  onDefaultValueChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emitParams({ default_value_rule: value || '' });
  }

  onDuplicableToggle(enabled: boolean): void {
    this.emitParams({
      duplicable: enabled
        ? { enabled: true, min_count: null, max_count: null }
        : null,
    });
  }

  onConstrainedToggle(enabled: boolean): void {
    this.emitParams({
      constrained_values: enabled
        ? { enabled: true, min_value: null, max_value: null }
        : null,
    });
  }
}
