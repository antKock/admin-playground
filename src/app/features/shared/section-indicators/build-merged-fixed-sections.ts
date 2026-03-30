import { components } from '@app/core/api/generated/api-types';
import { FIXED_SECTION_TYPES, SECTION_TYPE_MAP } from '@shared/components/section-card/section-card.models';
import { DisplaySection } from './display-section.model';
import { SECTION_RULE_DEFAULTS } from './display-section.model';

type SectionModelWithIndicators = components['schemas']['SectionModelWithIndicators'];

/**
 * Builds an array of fixed sections (application + progress), filling in
 * stub entries for any that don't exist on the model yet.
 */
export function buildMergedFixedSections(
  sections: SectionModelWithIndicators[],
): DisplaySection[] {
  return FIXED_SECTION_TYPES.map((sType, idx) => {
    const existing = sections.find((s) => s.key === sType);
    if (existing) return existing as DisplaySection;
    const config = SECTION_TYPE_MAP[sType];
    return {
      id: null,
      name: config.label,
      key: sType,
      is_enabled: true,
      position: idx,
      ...SECTION_RULE_DEFAULTS,
      created_at: '',
      last_updated_at: '',
      indicators: [],
    } as DisplaySection;
  });
}
