import { components } from '@app/core/api/generated/api-types';

export type ActivityResponse = components['schemas']['ActivityResponse'];
export type VersionComparison = components['schemas']['VersionComparison'];
export type ActionType = components['schemas']['ActionType'];

/** All known model-level entity types. Derive EntityType and MODEL_ENTITY_TYPES from this single source. */
export const ENTITY_TYPES = [
  'FundingProgram',
  'FolderModel',
  'ActionModel',
  'ActionTheme',
  'Community',
  'Agent',
  'IndicatorModel',
  'User',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export type EntityTypeCategory = 'all' | 'models' | 'instances';

export interface ActivityFilters {
  entity_type?: string;
  action?: ActionType;
  since?: string;
  cursor?: string;
  limit?: number;
}

export interface EntityVersionSnapshot {
  entity_type: string;
  entity_id: string;
  snapshot_date: string;
  readonly: boolean;
  data: Record<string, unknown>;
}

/** A group of activities collapsed by time proximity (same entity + user + 1min window). */
export interface TimeGroup {
  key: string;
  activities: ActivityResponse[];
  hiddenCount: number;
}

/** A parent-child group: a parent activity with its cascade children. */
export interface ParentChildGroup {
  key: string;
  primary: ActivityResponse;
  children: ActivityResponse[];
}
