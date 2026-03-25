// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type ActionModel = components['schemas']['ActionModelRead'];
export type ActionModelCreate = components['schemas']['ActionModelCreate'];
export type ActionModelUpdate = components['schemas']['ActionModelUpdate'];
// An indicator model with its association-specific params (rules, occurrence, constrained_values) within an action model.
export type IndicatorModelWithAssociation = components['schemas']['IndicatorModelWithAssociation'];
// Payload for attaching/updating an indicator model's params on an action model.
export type IndicatorModelAssociationInput = components['schemas']['IndicatorModelAssociationInput'];
// Child indicator within a group association (read + input).
export type ChildIndicatorModelWithAssociation = components['schemas']['ChildIndicatorModelWithAssociation'];
export type ChildIndicatorModelAssociationInput = components['schemas']['ChildIndicatorModelAssociationInput'];
export type SectionModelCreate = components['schemas']['SectionModelCreate'];
export type SectionModelUpdate = components['schemas']['SectionModelUpdate'];
export type SectionModelWithIndicators = components['schemas']['SectionModelWithIndicators'];
export type SectionIndicatorAssociationInput = components['schemas']['SectionIndicatorAssociationInput'];
export type SectionIndicatorModelRead = components['schemas']['SectionIndicatorModelRead'];
