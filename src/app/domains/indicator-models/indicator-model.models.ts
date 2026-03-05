// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type IndicatorModel = components['schemas']['IndicatorModelRead'];
export type IndicatorModelCreate = components['schemas']['IndicatorModelCreate'];
export type IndicatorModelUpdate = components['schemas']['IndicatorModelUpdate'];
export type IndicatorModelType = components['schemas']['IndicatorModelType'];
