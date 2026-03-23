import { Component, input, output, signal } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { LucideAngularModule, GripVertical, ChevronDown, X, Asterisk, PenOff, EyeOff, Clipboard, Copy, Braces } from 'lucide-angular';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ParamHintIconsComponent, ParamHints } from '../param-hint-icons/param-hint-icons.component';
import { ToggleRowComponent } from '../toggle-row/toggle-row.component';
import { RuleFieldComponent } from '../rule-field/rule-field.component';

export interface ChildCardData {
  id: string;
  name: string;
  technical_label?: string;
  type: string;
  paramHints: ParamHints;
}

export interface ChildParamsChangeEvent {
  childId: string;
  params: IndicatorParams;
}

export interface IndicatorCardData {
  id: string;
  name: string;
  technical_label?: string;
  type: string;
  paramHints: ParamHints;
  children?: ChildCardData[];
}

export interface IndicatorParams {
  hidden_rule: string | null;
  required_rule: string | null;
  disabled_rule: string | null;
  default_value_rule: string | null;
  duplicable_rule: string | null;
  constrained_rule: string | null;
}

export type RuleField = 'hidden_rule' | 'required_rule' | 'disabled_rule' | 'duplicable_rule' | 'constrained_rule';

/** Default values per rule field — used to determine if a toggle is "active" (overridden). */
const RULE_DEFAULTS: Record<RuleField, string> = {
  required_rule: 'false',
  disabled_rule: 'false',
  hidden_rule: 'false',
  duplicable_rule: 'false',
  constrained_rule: 'false',
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
                [modelType]="modelType()"
                [modelId]="modelId()"
                [excludeIndicator]="indicator().technical_label"
                (valueChange)="onRuleChange('required_rule', $event)"
              />
            }
          </div>

          <!-- Not Editable -->
          <div class="param-section">
            <app-toggle-row
              label="Non éditable"
              [icon]="PenOffIcon"
              [enabled]="isOverridden('disabled_rule')"
              (toggle)="onDisabledToggle($event)"
            />
            @if (isOverridden('disabled_rule')) {
              <app-rule-field
                [value]="isCustomRule(params().disabled_rule) ? params().disabled_rule! : ''"
                [modelType]="modelType()"
                [modelId]="modelId()"
                [excludeIndicator]="indicator().technical_label"
                (valueChange)="onRuleChange('disabled_rule', $event)"
              />
            }
          </div>

          <!-- Masqué (Hidden) -->
          <div class="param-section">
            <app-toggle-row
              label="Masqué"
              [icon]="EyeOffIcon"
              [enabled]="isOverridden('hidden_rule')"
              (toggle)="onHiddenToggle($event)"
            />
            @if (isOverridden('hidden_rule')) {
              <app-rule-field
                [value]="isCustomRule(params().hidden_rule) ? params().hidden_rule! : ''"
                [modelType]="modelType()"
                [modelId]="modelId()"
                [excludeIndicator]="indicator().technical_label"
                (valueChange)="onRuleChange('hidden_rule', $event)"
              />
            }
          </div>

          <!-- Default Value -->
          <div class="param-section">
            <app-toggle-row
              label="Valeur par défaut"
              [icon]="ClipboardIcon"
              [enabled]="params().default_value_rule != null && params().default_value_rule !== 'false'"
              (toggle)="onDefaultValueToggle($event)"
            />
            @if (params().default_value_rule != null && params().default_value_rule !== 'false') {
              <app-rule-field
                mode="value"
                [value]="params().default_value_rule ?? ''"
                [modelType]="modelType()"
                [modelId]="modelId()"
                [excludeIndicator]="indicator().technical_label"
                (valueChange)="onDefaultValueInput($event)"
              />
            }
          </div>

          <!-- Duplicable -->
          <div class="param-section">
            <app-toggle-row
              label="Duplicable"
              [icon]="CopyIcon"
              [enabled]="isOverridden('duplicable_rule')"
              (toggle)="onDuplicableToggle($event)"
            />
            @if (isOverridden('duplicable_rule')) {
              <app-rule-field
                [value]="isCustomRule(params().duplicable_rule) ? params().duplicable_rule! : ''"
                [modelType]="modelType()"
                [modelId]="modelId()"
                [excludeIndicator]="indicator().technical_label"
                (valueChange)="onRuleChange('duplicable_rule', $event)"
              />
            }
          </div>

          <!-- Constrained Values -->
          <div class="param-section" [class.last]="!indicator().children?.length">
            <app-toggle-row
              label="Valeurs contraintes"
              [icon]="BracesIcon"
              [enabled]="isOverridden('constrained_rule')"
              (toggle)="onConstrainedToggle($event)"
            />
            @if (isOverridden('constrained_rule')) {
              <app-rule-field
                [value]="isCustomRule(params().constrained_rule) ? params().constrained_rule! : ''"
                [modelType]="modelType()"
                [modelId]="modelId()"
                [excludeIndicator]="indicator().technical_label"
                (valueChange)="onRuleChange('constrained_rule', $event)"
              />
            }
          </div>

          <!-- Children -->
          @if (indicator().children?.length) {
            <div class="children-section">
              <div class="children-label">Indicateurs enfants</div>
              @for (child of indicator().children!; track child.id) {
                <div class="child-indicator" [class.child-expanded]="isChildExpanded(child.id)">
                  <div class="child-header" (click)="toggleChildExpanded(child.id)">
                    <div>
                      <span class="child-name">{{ child.name }}</span>
                      <span class="child-technical">
                        {{ child.technical_label }}
                        &nbsp;
                        <app-status-badge [status]="child.type" />
                      </span>
                    </div>
                    <div class="child-right">
                      <app-param-hint-icons [hints]="child.paramHints" />
                      <span class="child-expand-icon">
                        <lucide-icon [img]="ChevronDown" [size]="14" />
                      </span>
                    </div>
                  </div>
                  @if (isChildExpanded(child.id)) {
                    <div class="child-body">
                      <div class="param-section">
                        <app-toggle-row label="Obligatoire" [icon]="AsteriskIcon"
                          [enabled]="isChildRuleOverridden(child.id, 'required_rule')"
                          (toggle)="onChildToggle(child.id, 'required_rule', $event)" />
                        @if (isChildRuleOverridden(child.id, 'required_rule')) {
                          <app-rule-field
                            [value]="isCustomRule(getChildParams(child.id).required_rule) ? getChildParams(child.id).required_rule! : ''"
                            [modelType]="modelType()" [modelId]="modelId()"
                            (valueChange)="onChildRuleChange(child.id, 'required_rule', $event)" />
                        }
                      </div>
                      <div class="param-section">
                        <app-toggle-row label="Non éditable" [icon]="PenOffIcon"
                          [enabled]="isChildRuleOverridden(child.id, 'disabled_rule')"
                          (toggle)="onChildToggle(child.id, 'disabled_rule', $event)" />
                        @if (isChildRuleOverridden(child.id, 'disabled_rule')) {
                          <app-rule-field
                            [value]="isCustomRule(getChildParams(child.id).disabled_rule) ? getChildParams(child.id).disabled_rule! : ''"
                            [modelType]="modelType()" [modelId]="modelId()"
                            (valueChange)="onChildRuleChange(child.id, 'disabled_rule', $event)" />
                        }
                      </div>
                      <div class="param-section">
                        <app-toggle-row label="Masqué" [icon]="EyeOffIcon"
                          [enabled]="isChildRuleOverridden(child.id, 'hidden_rule')"
                          (toggle)="onChildToggle(child.id, 'hidden_rule', $event)" />
                        @if (isChildRuleOverridden(child.id, 'hidden_rule')) {
                          <app-rule-field
                            [value]="isCustomRule(getChildParams(child.id).hidden_rule) ? getChildParams(child.id).hidden_rule! : ''"
                            [modelType]="modelType()" [modelId]="modelId()"
                            (valueChange)="onChildRuleChange(child.id, 'hidden_rule', $event)" />
                        }
                      </div>
                      <div class="param-section">
                        <app-toggle-row label="Valeur par défaut" [icon]="ClipboardIcon"
                          [enabled]="getChildParams(child.id).default_value_rule != null && getChildParams(child.id).default_value_rule !== 'false'"
                          (toggle)="onChildDefaultValueToggle(child.id, $event)" />
                        @if (getChildParams(child.id).default_value_rule != null && getChildParams(child.id).default_value_rule !== 'false') {
                          <app-rule-field mode="value"
                            [value]="getChildParams(child.id).default_value_rule ?? ''"
                            [modelType]="modelType()" [modelId]="modelId()"
                            (valueChange)="onChildDefaultValueInput(child.id, $event)" />
                        }
                      </div>
                      <div class="param-section">
                        <app-toggle-row label="Duplicable" [icon]="CopyIcon"
                          [enabled]="isChildRuleOverridden(child.id, 'duplicable_rule')"
                          (toggle)="onChildToggle(child.id, 'duplicable_rule', $event)" />
                        @if (isChildRuleOverridden(child.id, 'duplicable_rule')) {
                          <app-rule-field
                            [value]="isCustomRule(getChildParams(child.id).duplicable_rule) ? getChildParams(child.id).duplicable_rule! : ''"
                            [modelType]="modelType()" [modelId]="modelId()"
                            (valueChange)="onChildRuleChange(child.id, 'duplicable_rule', $event)" />
                        }
                      </div>
                      <div class="param-section last">
                        <app-toggle-row label="Valeurs contraintes" [icon]="BracesIcon"
                          [enabled]="isChildRuleOverridden(child.id, 'constrained_rule')"
                          (toggle)="onChildToggle(child.id, 'constrained_rule', $event)" />
                        @if (isChildRuleOverridden(child.id, 'constrained_rule')) {
                          <app-rule-field
                            [value]="isCustomRule(getChildParams(child.id).constrained_rule) ? getChildParams(child.id).constrained_rule! : ''"
                            [modelType]="modelType()" [modelId]="modelId()"
                            (valueChange)="onChildRuleChange(child.id, 'constrained_rule', $event)" />
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
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
      padding: 12px 0 8px;
    }
    .param-section:first-child {
      padding-top: 4px;
    }
    .param-section.last,
    .param-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .children-section {
      padding-top: 12px;
      border-top: 1px solid var(--color-stroke-standard);
    }
    .children-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-text-tertiary);
      margin-bottom: 8px;
    }
    .child-indicator {
      background: var(--color-surface-subtle, #fafafa);
      border: 1px solid var(--color-stroke-standard);
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 6px;
    }
    .child-indicator:last-child {
      margin-bottom: 0;
    }
    .child-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }
    .child-header:hover {
      opacity: 0.8;
    }
    .child-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .child-expand-icon {
      color: var(--color-text-tertiary);
      transition: transform 0.15s;
      display: flex;
      align-items: center;
    }
    .child-expanded .child-expand-icon {
      transform: rotate(180deg);
    }
    .child-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary);
    }
    .child-technical {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 11px;
      color: var(--color-text-tertiary);
      margin-top: 2px;
    }
    .child-body {
      border-top: 1px solid var(--color-stroke-standard);
      margin-top: 8px;
      padding-top: 4px;
    }
    .child-body .param-section {
      padding: 8px 0 6px;
    }

`],
})
export class IndicatorCardComponent {
  readonly indicator = input.required<IndicatorCardData>();
  readonly params = input.required<IndicatorParams>();
  readonly modified = input(false);
  readonly modelType = input<'action' | 'folder'>();
  readonly modelId = input<string>();

  readonly childParams = input<Record<string, IndicatorParams>>({});

  readonly remove = output<string>();
  readonly paramsChange = output<IndicatorParams>();
  readonly childParamsChange = output<ChildParamsChangeEvent>();

  readonly expanded = signal(false);
  readonly expandedChildren = signal<Set<string>>(new Set());

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

  isOverridden(field: RuleField): boolean {
    return isRuleOverridden(field, this.params()[field]);
  }

  // Convention: rule values are either 'true'/'false' (boolean sentinels) or a JSONLogic string.
  // 'true'/'false' mean "always on/off"; anything else is a custom JSONLogic rule.
  isCustomRule(value: string | null): boolean {
    return value != null && value !== 'true' && value !== 'false';
  }

  onRuleChange(field: RuleField, value: string): void {
    // If the editor is cleared (empty string), fall back to the "on" value for this override.
    this.emitParams({ [field]: value || 'true' });
  }

  private toggleRule(field: RuleField, enabled: boolean): void {
    const current = this.params()[field];
    if (!enabled && this.isCustomRule(current)) {
      this.savedRules[field] = current!;
    }
    const onValue = this.savedRules[field] ?? 'true';
    // OFF → null (no override). Works today (backend treats null as default) and after backend migration.
    this.emitParams({ [field]: enabled ? onValue : null });
  }

  onHiddenToggle(enabled: boolean): void {
    this.toggleRule('hidden_rule', enabled);
  }

  onRequiredToggle(enabled: boolean): void {
    this.toggleRule('required_rule', enabled);
  }

  onDisabledToggle(enabled: boolean): void {
    this.toggleRule('disabled_rule', enabled);
  }

  onDefaultValueToggle(enabled: boolean): void {
    if (enabled) {
      this.emitParams({ default_value_rule: '' });
    } else {
      this.emitParams({ default_value_rule: null });
    }
  }

  onDefaultValueInput(value: string): void {
    this.emitParams({ default_value_rule: value || '' });
  }

  onDuplicableToggle(enabled: boolean): void {
    this.toggleRule('duplicable_rule', enabled);
  }

  onConstrainedToggle(enabled: boolean): void {
    this.toggleRule('constrained_rule', enabled);
  }

  // --- Child indicator param editing ---

  toggleChildExpanded(childId: string): void {
    const next = new Set(this.expandedChildren());
    if (next.has(childId)) {
      next.delete(childId);
    } else {
      next.add(childId);
    }
    this.expandedChildren.set(next);
  }

  isChildExpanded(childId: string): boolean {
    return this.expandedChildren().has(childId);
  }

  getChildParams(childId: string): IndicatorParams {
    return this.childParams()[childId] ?? { hidden_rule: null, required_rule: null, disabled_rule: null, default_value_rule: null, duplicable_rule: null, constrained_rule: null };
  }

  isChildRuleOverridden(childId: string, field: RuleField): boolean {
    return isRuleOverridden(field, this.getChildParams(childId)[field]);
  }

  private emitChildParams(childId: string, partial: Partial<IndicatorParams>): void {
    this.childParamsChange.emit({ childId, params: { ...this.getChildParams(childId), ...partial } });
  }

  private savedChildRules: Record<string, Record<string, string>> = {};

  onChildRuleChange(childId: string, field: RuleField, value: string): void {
    this.emitChildParams(childId, { [field]: value || 'true' });
  }

  private toggleChildRule(childId: string, field: RuleField, enabled: boolean): void {
    const current = this.getChildParams(childId)[field];
    if (!this.savedChildRules[childId]) this.savedChildRules[childId] = {};
    if (!enabled && this.isCustomRule(current)) {
      this.savedChildRules[childId][field] = current!;
    }
    const onValue = this.savedChildRules[childId]?.[field] ?? 'true';
    this.emitChildParams(childId, { [field]: enabled ? onValue : null });
  }

  onChildToggle(childId: string, field: RuleField, enabled: boolean): void {
    this.toggleChildRule(childId, field, enabled);
  }

  onChildDefaultValueToggle(childId: string, enabled: boolean): void {
    this.emitChildParams(childId, { default_value_rule: enabled ? '' : null });
  }

  onChildDefaultValueInput(childId: string, value: string): void {
    this.emitChildParams(childId, { default_value_rule: value || '' });
  }
}
