import { components } from '@app/core/api/generated/api-types';
import { IndicatorParams } from '@app/shared/components/indicator-card/indicator-card.component';
import { paramsToSectionRules } from './section-indicator-param-editor';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionIndicatorAssociationInput = components['schemas']['SectionIndicatorAssociationInput'];

function ruleForApi(value: string | null | undefined): string {
  return value ?? 'false';
}

/**
 * Build API association inputs from section indicator data, optionally merging param edits.
 * @param indicators - Current section indicator models
 * @param paramEdits - Optional map of edited params keyed by "indicatorId" or "parentId:childId"
 */
export function buildSectionAssociationInputs(
  indicators: SectionIndicatorModelRead[],
  paramEdits?: Map<string, IndicatorParams>,
): SectionIndicatorAssociationInput[] {
  return indicators.map((ind, index) => {
    const edited = paramEdits?.get(ind.id);
    if (edited) {
      const rules = paramsToSectionRules(edited);
      return {
        indicator_model_id: ind.id,
        ...rules,
        position: index,
      };
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
