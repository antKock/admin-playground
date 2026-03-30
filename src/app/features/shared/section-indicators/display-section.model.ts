import { components } from '@app/core/api/generated/api-types';

type SectionModelWithIndicators = components['schemas']['SectionModelWithIndicators'];

export type DisplaySection = Omit<SectionModelWithIndicators, 'id'> & { id: string | null };

/** Default rule values for new sections and indicators (not including default_value_rule, which only applies to indicator associations). */
export const SECTION_RULE_DEFAULTS = {
  hidden_rule: 'false',
  disabled_rule: 'false',
  required_rule: 'false',
  occurrence_min_rule: 'false',
  occurrence_max_rule: 'false',
  constrained_rule: 'false',
} as const;
