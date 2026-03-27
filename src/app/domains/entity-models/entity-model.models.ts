// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type EntityModel = components['schemas']['EntityModelRead'];
export type EntityModelUpdate = components['schemas']['EntityModelUpdate'];
export type EntityModelType = components['schemas']['EntityModelType'];
export type SectionModelCreate = components['schemas']['SectionModelCreate'];
export type SectionModelUpdate = components['schemas']['SectionModelUpdate'];
export type SectionModelWithIndicators = components['schemas']['SectionModelWithIndicators'];
export type SectionIndicatorAssociationInput = components['schemas']['SectionIndicatorAssociationInput'];
