import { components } from '@app/core/api/generated/api-types';

export type ActivityResponse = components['schemas']['ActivityResponse'];
export type ActionType = components['schemas']['ActionType'];

export type EntityType =
  | 'FundingProgram'
  | 'FolderModel'
  | 'ActionModel'
  | 'ActionTheme'
  | 'Community'
  | 'Agent'
  | 'IndicatorModel'
  | 'User';

export interface ActivityFilters {
  entity_type?: string;
  action?: ActionType;
  since?: string;
  cursor?: string;
  limit?: number;
}
