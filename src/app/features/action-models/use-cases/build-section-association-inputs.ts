import { components } from '@app/core/api/generated/api-types';

type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
type SectionIndicatorAssociationInput = components['schemas']['SectionIndicatorAssociationInput'];

function ruleForApi(value: string | null | undefined): string {
  return value ?? 'false';
}

export function buildSectionAssociationInputs(
  indicators: SectionIndicatorModelRead[],
): SectionIndicatorAssociationInput[] {
  return indicators.map((ind, index) => ({
    indicator_model_id: ind.id,
    hidden_rule: ruleForApi(ind.hidden_rule),
    required_rule: ruleForApi(ind.required_rule),
    disabled_rule: ruleForApi(ind.disabled_rule),
    default_value_rule: ruleForApi(ind.default_value_rule),
    occurrence_min_rule: ruleForApi(ind.occurrence_min_rule),
    occurrence_max_rule: ruleForApi(ind.occurrence_max_rule),
    constrained_rule: ruleForApi(ind.constrained_rule),
    position: index,
  }));
}
