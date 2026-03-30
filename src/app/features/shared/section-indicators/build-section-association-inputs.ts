import { components } from '@app/core/api/generated/api-types';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';

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
    const src = lookup.get(ind.id) ?? ind;
    return {
      indicator_model_id: ind.id,
      hidden_rule: ruleForApi(src.hidden_rule),
      required_rule: ruleForApi(src.required_rule),
      disabled_rule: ruleForApi(src.disabled_rule),
      default_value_rule: ruleForApi(src.default_value_rule),
      occurrence_rule: { min: ruleForApi(src.occurrence_rule?.min), max: ruleForApi(src.occurrence_rule?.max) },
      constrained_rule: ruleForApi(src.constrained_rule),
      position: index,
    };
  });
}
