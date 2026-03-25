import { computed, signal } from '@angular/core';

import { IndicatorModelWithAssociation } from '@domains/action-models/action-model.models';
import { IndicatorParams, OccurrenceRule } from '@app/shared/components/indicator-card/indicator-card.component';

function childKey(parentId: string, childId: string): string {
  return `${parentId}:${childId}`;
}

function toOccurrenceRule(im: { occurrence_rule?: { min: string; max: string } }): OccurrenceRule | null {
  return im.occurrence_rule ? { min: im.occurrence_rule.min, max: im.occurrence_rule.max } : null;
}

function toIndicatorParams(im: {
  hidden_rule: string; required_rule: string; disabled_rule: string;
  default_value_rule: string; occurrence_rule?: { min: string; max: string }; constrained_rule: string;
}): IndicatorParams {
  return {
    hidden_rule: im.hidden_rule,
    required_rule: im.required_rule,
    disabled_rule: im.disabled_rule,
    default_value_rule: im.default_value_rule,
    occurrence_rule: toOccurrenceRule(im),
    constrained_rule: im.constrained_rule,
  };
}

const EMPTY_PARAMS: IndicatorParams = {
  hidden_rule: null, required_rule: null, disabled_rule: null,
  default_value_rule: null, occurrence_rule: null, constrained_rule: null,
};

/**
 * Tracks unsaved changes to indicator params (rules) before persisting.
 * _edits is a Map<key, modified IndicatorParams>. Keys are either an indicator ID
 * (for parent indicators) or "parentId:childId" (for child indicators within a group).
 */
export function createIndicatorParamEditor(attachedFn: () => IndicatorModelWithAssociation[]) {
  const _edits = signal<Map<string, IndicatorParams>>(new Map());

  const edits = _edits.asReadonly();

  function occurrenceRuleEquals(a: OccurrenceRule | null, b: OccurrenceRule | null | undefined): boolean {
    if (a == null && (b == null || b === undefined)) return true;
    if (a == null || b == null) return false;
    return a.min === b.min && a.max === b.max;
  }

  function isParamModified(
    original: { hidden_rule: string; required_rule: string; disabled_rule: string; default_value_rule: string; occurrence_rule?: { min: string; max: string }; constrained_rule: string },
    edited: IndicatorParams,
  ): boolean {
    return (
      original.hidden_rule !== (edited.hidden_rule ?? 'false') ||
      original.required_rule !== (edited.required_rule ?? 'false') ||
      original.disabled_rule !== (edited.disabled_rule ?? 'false') ||
      original.default_value_rule !== (edited.default_value_rule ?? 'false') ||
      !occurrenceRuleEquals(edited.occurrence_rule, original.occurrence_rule) ||
      original.constrained_rule !== (edited.constrained_rule ?? 'false')
    );
  }

  const unsavedCount = computed(() => {
    const currentEdits = _edits();
    const attached = attachedFn();
    let count = 0;
    for (const [key, edited] of currentEdits) {
      if (key.includes(':')) {
        const [parentId, childId] = key.split(':');
        const parent = attached.find((im) => im.id === parentId);
        const child = parent?.children?.find((c) => c.id === childId);
        if (child && isParamModified(child, edited)) count++;
      } else {
        const original = attached.find((im) => im.id === key);
        if (original && isParamModified(original, edited)) count++;
      }
    }
    return count;
  });

  const modifiedIds = computed(() => {
    const currentEdits = _edits();
    const attached = attachedFn();
    const ids: string[] = [];
    for (const [key, edited] of currentEdits) {
      if (key.includes(':')) {
        const [parentId, childId] = key.split(':');
        const parent = attached.find((im) => im.id === parentId);
        const child = parent?.children?.find((c) => c.id === childId);
        if (child && isParamModified(child, edited)) ids.push(key);
      } else {
        const original = attached.find((im) => im.id === key);
        if (original && isParamModified(original, edited)) ids.push(key);
      }
    }
    return ids;
  });

  function getParamsForIndicator(indicatorId: string): IndicatorParams {
    const edited = _edits().get(indicatorId);
    if (edited) return edited;
    const attached = attachedFn().find((im) => im.id === indicatorId);
    if (!attached) return { ...EMPTY_PARAMS };
    return toIndicatorParams(attached);
  }

  function getParamsForChild(parentId: string, childId: string): IndicatorParams {
    const key = childKey(parentId, childId);
    const edited = _edits().get(key);
    if (edited) return edited;
    const parent = attachedFn().find((im) => im.id === parentId);
    const child = parent?.children?.find((c) => c.id === childId);
    if (!child) return { ...EMPTY_PARAMS };
    return toIndicatorParams(child);
  }

  function updateParams(indicatorId: string, params: IndicatorParams): void {
    const next = new Map(_edits());
    next.set(indicatorId, params);
    _edits.set(next);
  }

  function updateChildParams(parentId: string, childId: string, params: IndicatorParams): void {
    const next = new Map(_edits());
    next.set(childKey(parentId, childId), params);
    _edits.set(next);
  }

  function discard(): void {
    _edits.set(new Map());
  }

  /** Validates all JSON rules. Returns null on success, or an error message string. */
  function validateRules(): string | null {
    const currentEdits = _edits();
    for (const [, params] of currentEdits) {
      const rules = [params.hidden_rule, params.required_rule, params.disabled_rule, params.default_value_rule, params.constrained_rule];
      if (params.occurrence_rule) {
        rules.push(params.occurrence_rule.min, params.occurrence_rule.max);
      }
      for (const rule of rules) {
        if (rule != null && rule !== 'true' && rule !== 'false') {
          const trimmed = rule.trim();
          if (trimmed) {
            try {
              JSON.parse(trimmed);
            } catch {
              return 'Corrigez les erreurs JSON avant d\'enregistrer';
            }
          }
        }
      }
    }
    return null;
  }

  return {
    edits,
    unsavedCount,
    modifiedIds,
    getParamsForIndicator,
    getParamsForChild,
    updateParams,
    updateChildParams,
    discard,
    validateRules,
  };
}
