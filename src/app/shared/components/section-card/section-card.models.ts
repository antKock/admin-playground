import { components } from '@app/core/api/generated/api-types';

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
