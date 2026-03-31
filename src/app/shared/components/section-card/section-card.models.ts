import { components } from '@app/core/api/generated/api-types';
import { ParamState, ParamHints } from '../param-hint-icons/param-hint-icons.component';
import { SectionParams } from './section-params-editor.component';

export type SectionKey = components['schemas']['SectionKey'];

export interface SectionTypeConfig {
  label: string;
  icon: string;
}

export const SECTION_TYPE_MAP: Record<SectionKey, SectionTypeConfig> = {
  buildings: { label: 'Sites', icon: '🏠' },
  agents: { label: 'Agents', icon: '👤' },
  communities: { label: 'Communautés', icon: '🏘' },
  application: { label: 'Candidature', icon: '📋' },
  progress: { label: 'Suivi', icon: '📈' },
  financial: { label: 'Financier', icon: '💰' },
  additional_info: { label: 'Informations complémentaires', icon: '📎' },
};

export const ASSOCIATION_SECTION_TYPES: SectionKey[] = [
  'buildings',
  'agents',
  'communities',
];

export const FIXED_SECTION_TYPES: SectionKey[] = [
  'financial',
  'application',
  'progress',
];

export function isAssociationSection(section: { association_entity_type?: string | null }): boolean {
  return section.association_entity_type != null;
}

function ruleToState(value: string): ParamState {
  if (value === 'false') return 'off';
  if (value === 'true') return 'on';
  return 'rule';
}

export function sectionParamsToHints(params: SectionParams): ParamHints {
  const occMin = params.occurrence_rule.min;
  const occMax = params.occurrence_rule.max;
  let occurrence: ParamState = 'off';
  if (occMin !== 'false' || occMax !== 'false') {
    occurrence = (occMin !== 'false' && occMin !== 'true') || (occMax !== 'false' && occMax !== 'true') ? 'rule' : 'on';
  }

  return {
    visibility: ruleToState(params.hidden_rule),
    required: ruleToState(params.required_rule),
    editable: ruleToState(params.disabled_rule),
    defaultValue: 'off', // sections don't have default_value_rule
    occurrence,
    constrained: ruleToState(params.constrained_rule),
  };
}
