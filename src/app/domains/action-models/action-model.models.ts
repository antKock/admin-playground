// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type ActionModel = components['schemas']['ActionModelRead'];
export type ActionModelCreate = components['schemas']['ActionModelCreate'];
export type ActionModelUpdate = components['schemas']['ActionModelUpdate'];
// An indicator model with its association-specific params (rules, duplicable, constrained_values) within an action model.
export type IndicatorModelWithAssociation = components['schemas']['IndicatorModelWithAssociation'];
// Payload for attaching/updating an indicator model's params on an action model.
export type IndicatorModelAssociationInput = components['schemas']['IndicatorModelAssociationInput'];
