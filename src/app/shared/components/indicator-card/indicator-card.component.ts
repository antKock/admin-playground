import { Component, input, output, signal } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { LucideAngularModule, GripVertical, ChevronDown, X, Asterisk, PenOff, EyeOff, Clipboard, Copy, Braces } from 'lucide-angular';

import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ParamHintIconsComponent, ParamHints } from '../param-hint-icons/param-hint-icons.component';
import { ToggleRowComponent } from '../toggle-row/toggle-row.component';
import { RuleFieldComponent } from '../rule-field/rule-field.component';
import { components } from '@app/core/api/generated/api-types';

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

export type OccurrenceRule = components['schemas']['OccurrenceRule'];

export interface IndicatorParams {
  hidden_rule: string | null;
  required_rule: string | null;
  disabled_rule: string | null;
  default_value_rule: string | null;
  occurrence_rule: OccurrenceRule | null;
  constrained_rule: string | null;
}

export type RuleField = 'hidden_rule' | 'required_rule' | 'disabled_rule' | 'constrained_rule';

/** Default values per rule field — used to determine if a toggle is "active" (overridden). */
const RULE_DEFAULTS: Record<RuleField, string> = {
  required_rule: 'false',
  disabled_rule: 'false',
  hidden_rule: 'false',
  constrained_rule: 'false',
};

/** Returns true when the rule field has been actively configured (overridden from default). */
export function isRuleOverridden(field: RuleField, value: string | null): boolean {
  return value != null && value !== RULE_DEFAULTS[field];
}

@Component({
  selector: 'app-indicator-card',
  imports: [StatusBadgeComponent, ParamHintIconsComponent, ToggleRowComponent, RuleFieldComponent, CdkDragHandle, LucideAngularModule],
  templateUrl: './indicator-card.component.html',
  styleUrl: './indicator-card.component.css',
})
export class IndicatorCardComponent {
  readonly indicator = input.required<IndicatorCardData>();
  readonly params = input.required<IndicatorParams>();
  readonly modified = input(false);
  readonly modelType = input<'action' | 'folder' | 'entity'>();
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

  isOccurrenceOverridden(): boolean {
    const occ = this.params().occurrence_rule;
    return occ != null && (occ.min !== 'false' || occ.max !== 'false');
  }

  onOccurrenceToggle(enabled: boolean): void {
    if (enabled) {
      this.emitParams({ occurrence_rule: { min: 'true', max: 'false' } });
    } else {
      this.emitParams({ occurrence_rule: null });
    }
  }

  onOccurrenceMinChange(value: string): void {
    const occ = this.params().occurrence_rule ?? { min: 'false', max: 'false' };
    this.emitParams({ occurrence_rule: { ...occ, min: value || 'true' } });
  }

  onOccurrenceMaxChange(value: string): void {
    const occ = this.params().occurrence_rule ?? { min: 'false', max: 'false' };
    this.emitParams({ occurrence_rule: { ...occ, max: value || 'true' } });
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
    return this.childParams()[childId] ?? { hidden_rule: null, required_rule: null, disabled_rule: null, default_value_rule: null, occurrence_rule: null, constrained_rule: null };
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

  isChildOccurrenceOverridden(childId: string): boolean {
    const occ = this.getChildParams(childId).occurrence_rule;
    return occ != null && (occ.min !== 'false' || occ.max !== 'false');
  }

  onChildOccurrenceToggle(childId: string, enabled: boolean): void {
    if (enabled) {
      this.emitChildParams(childId, { occurrence_rule: { min: 'true', max: 'false' } });
    } else {
      this.emitChildParams(childId, { occurrence_rule: null });
    }
  }

  onChildOccurrenceMinChange(childId: string, value: string): void {
    const occ = this.getChildParams(childId).occurrence_rule ?? { min: 'false', max: 'false' };
    this.emitChildParams(childId, { occurrence_rule: { ...occ, min: value || 'true' } });
  }

  onChildOccurrenceMaxChange(childId: string, value: string): void {
    const occ = this.getChildParams(childId).occurrence_rule ?? { min: 'false', max: 'false' };
    this.emitChildParams(childId, { occurrence_rule: { ...occ, max: value || 'true' } });
  }

  onChildDefaultValueToggle(childId: string, enabled: boolean): void {
    this.emitChildParams(childId, { default_value_rule: enabled ? '' : null });
  }

  onChildDefaultValueInput(childId: string, value: string): void {
    this.emitChildParams(childId, { default_value_rule: value || '' });
  }
}
