import { components } from '@app/core/api/generated/api-types';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { paramsToSectionRules } from './section-indicator-param-editor';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionIndicatorAssociationInput = components['schemas']['SectionIndicatorAssociationInput'];

function ruleForApi(value: string | null | undefined): string {
  return value ?? 'false';
}

/**
 * Build a flat lookup from param edits.
 * Parent keys "indicatorId" → lookup by indicatorId.
 * Child keys "parentId:childId" → lookup by childId.
 */
function buildEditLookup(paramEdits?: Map<string, IndicatorParams>): Map<string, IndicatorParams> {
  if (!paramEdits || paramEdits.size === 0) return new Map();
  const lookup = new Map<string, IndicatorParams>();
  for (const [key, params] of paramEdits) {
    const parts = key.split(':');
    const effectiveId = parts[parts.length - 1];
    lookup.set(effectiveId, params);
  }
  return lookup;
}

/**
 * Build API association inputs from section indicator data, optionally merging param edits.
 * The indicators array is flat (parents AND children are top-level entries).
 * @param indicators - Current section indicator models (flat list including children)
 * @param paramEdits - Optional map keyed by "indicatorId" or "parentId:childId"
 */
export function buildSectionAssociationInputs(
  indicators: SectionIndicatorModelRead[],
  paramEdits?: Map<string, IndicatorParams>,
): SectionIndicatorAssociationInput[] {
  const lookup = buildEditLookup(paramEdits);

  return indicators.map((ind, index) => {
    const edited = lookup.get(ind.id);
    if (edited) {
      return { indicator_model_id: ind.id, ...paramsToSectionRules(edited), position: index };
    }
    return {
      indicator_model_id: ind.id,
      hidden_rule: ruleForApi(ind.hidden_rule),
      required_rule: ruleForApi(ind.required_rule),
      disabled_rule: ruleForApi(ind.disabled_rule),
      default_value_rule: ruleForApi(ind.default_value_rule),
      occurrence_min_rule: ruleForApi(ind.occurrence_min_rule),
      occurrence_max_rule: ruleForApi(ind.occurrence_max_rule),
      constrained_rule: ruleForApi(ind.constrained_rule),
      position: index,
    };
  });
}
