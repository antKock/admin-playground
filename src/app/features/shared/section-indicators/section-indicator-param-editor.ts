import { computed, signal } from '@angular/core';

import { IndicatorParams, OccurrenceRule } from '@app/shared/components/indicator-card/indicator-card.component';
import { components } from '@app/core/api/generated/api-types';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionChildIndicatorModelRead = components['schemas']['SectionChildIndicatorModelRead'];

interface SectionWithIndicators {
  id: string;
  key: string;
  indicators?: SectionIndicatorModelRead[];
}

function childKey(sectionId: string, parentId: string, childId: string): string {
  return `${sectionId}:${parentId}:${childId}`;
}

function indicatorKey(sectionId: string, indicatorId: string): string {
  return `${sectionId}:${indicatorId}`;
}

export function sectionIndicatorToParams(ind: SectionIndicatorModelRead | SectionChildIndicatorModelRead): IndicatorParams {
  const occ = ind.occurrence_rule;
  return {
    hidden_rule: ind.hidden_rule,
    required_rule: ind.required_rule,
    disabled_rule: ind.disabled_rule,
    default_value_rule: ind.default_value_rule,
    occurrence_rule: occ && (occ.min !== 'false' || occ.max !== 'false') ? occ : null,
    constrained_rule: ind.constrained_rule,
  };
}

const EMPTY_PARAMS: IndicatorParams = {
  hidden_rule: null, required_rule: null, disabled_rule: null,
  default_value_rule: null, occurrence_rule: null, constrained_rule: null,
};

/**
 * Tracks unsaved changes to section indicator params before persisting.
 * Keys use "sectionId:indicatorId" for parents and "sectionId:parentId:childId" for children.
 */
export function createSectionIndicatorParamEditor(sectionsFn: () => SectionWithIndicators[]) {
  const _edits = signal<Map<string, IndicatorParams>>(new Map());

  const edits = _edits.asReadonly();

  function occurrenceRuleEquals(a: OccurrenceRule | null, b: OccurrenceRule | null | undefined): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    return a.min === b.min && a.max === b.max;
  }

  function isParamModified(original: IndicatorParams, edited: IndicatorParams): boolean {
    return (
      (original.hidden_rule ?? 'false') !== (edited.hidden_rule ?? 'false') ||
      (original.required_rule ?? 'false') !== (edited.required_rule ?? 'false') ||
      (original.disabled_rule ?? 'false') !== (edited.disabled_rule ?? 'false') ||
      (original.default_value_rule ?? 'false') !== (edited.default_value_rule ?? 'false') ||
      !occurrenceRuleEquals(edited.occurrence_rule, original.occurrence_rule) ||
      (original.constrained_rule ?? 'false') !== (edited.constrained_rule ?? 'false')
    );
  }

  function findOriginal(key: string): IndicatorParams | null {
    const sections = sectionsFn();
    const parts = key.split(':');
    if (parts.length === 3) {
      // child: sectionId:parentId:childId
      const [sectionId, parentId, cId] = parts;
      const section = sections.find((s) => s.id === sectionId);
      const parent = section?.indicators?.find((ind) => ind.id === parentId);
      const child = parent?.children?.find((c) => c.id === cId);
      return child ? sectionIndicatorToParams(child) : null;
    } else {
      // parent: sectionId:indicatorId
      const [sectionId, indId] = parts;
      const section = sections.find((s) => s.id === sectionId);
      const ind = section?.indicators?.find((i) => i.id === indId);
      return ind ? sectionIndicatorToParams(ind) : null;
    }
  }

  const unsavedCount = computed(() => {
    const currentEdits = _edits();
    let count = 0;
    for (const [key, edited] of currentEdits) {
      const original = findOriginal(key);
      if (original && isParamModified(original, edited)) count++;
    }
    return count;
  });

  const modifiedIds = computed(() => {
    const currentEdits = _edits();
    const ids: string[] = [];
    for (const [key, edited] of currentEdits) {
      const original = findOriginal(key);
      if (original && isParamModified(original, edited)) ids.push(key);
    }
    return ids;
  });

  /** Returns the set of section IDs that have unsaved edits. */
  const editedSectionIds = computed(() => {
    const modified = modifiedIds();
    const sectionIds = new Set<string>();
    for (const key of modified) {
      sectionIds.add(key.split(':')[0]);
    }
    return sectionIds;
  });

  function getParamsForIndicator(sectionId: string, indicatorId: string): IndicatorParams {
    const key = indicatorKey(sectionId, indicatorId);
    const edited = _edits().get(key);
    if (edited) return edited;
    const original = findOriginal(key);
    return original ?? { ...EMPTY_PARAMS };
  }

  function getParamsForChild(sectionId: string, parentId: string, childId: string): IndicatorParams {
    const key = childKey(sectionId, parentId, childId);
    const edited = _edits().get(key);
    if (edited) return edited;
    const original = findOriginal(key);
    return original ?? { ...EMPTY_PARAMS };
  }

  function updateParams(sectionId: string, indicatorId: string, params: IndicatorParams): void {
    const next = new Map(_edits());
    next.set(indicatorKey(sectionId, indicatorId), params);
    _edits.set(next);
  }

  function updateChildParams(sectionId: string, parentId: string, childId: string, params: IndicatorParams): void {
    const next = new Map(_edits());
    next.set(childKey(sectionId, parentId, childId), params);
    _edits.set(next);
  }

  function isModified(sectionId: string, indicatorId: string): boolean {
    const key = indicatorKey(sectionId, indicatorId);
    const edited = _edits().get(key);
    if (!edited) return false;
    const original = findOriginal(key);
    return original ? isParamModified(original, edited) : false;
  }

  function discard(): void {
    _edits.set(new Map());
  }

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

  /**
   * Returns the edited params map for a specific section's indicators,
   * keyed by indicator ID (not composite key).
   */
  function getEditsForSection(sectionId: string): Map<string, IndicatorParams> {
    const currentEdits = _edits();
    const sectionEdits = new Map<string, IndicatorParams>();
    const prefix = `${sectionId}:`;
    for (const [key, params] of currentEdits) {
      if (key.startsWith(prefix)) {
        // Remove the sectionId prefix to get "indicatorId" or "parentId:childId"
        sectionEdits.set(key.slice(prefix.length), params);
      }
    }
    return sectionEdits;
  }

  return {
    edits,
    unsavedCount,
    modifiedIds,
    editedSectionIds,
    getParamsForIndicator,
    getParamsForChild,
    updateParams,
    updateChildParams,
    isModified,
    discard,
    validateRules,
    getEditsForSection,
  };
}
