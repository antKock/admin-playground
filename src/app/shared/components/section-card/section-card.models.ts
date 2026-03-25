import { components } from '@app/core/api/generated/api-types';

export type SectionType = components['schemas']['SectionType'];

export interface SectionTypeConfig {
  label: string;
  icon: string;
}

export const SECTION_TYPE_MAP: Record<SectionType, SectionTypeConfig> = {
  association_sites: { label: 'Sites', icon: '🏠' },
  association_agents: { label: 'Agents', icon: '👤' },
  association_communities: { label: 'Communautés', icon: '🏘' },
  application: { label: 'Candidature', icon: '📋' },
  progress: { label: 'Suivi', icon: '📈' },
  additional_info: { label: 'Informations complémentaires', icon: '📎' },
};

export const ASSOCIATION_SECTION_TYPES: SectionType[] = [
  'association_sites',
  'association_agents',
  'association_communities',
];

export const FIXED_SECTION_TYPES: SectionType[] = [
  'application',
  'progress',
];

export function isAssociationSection(sectionType: SectionType): boolean {
  return ASSOCIATION_SECTION_TYPES.includes(sectionType);
}
