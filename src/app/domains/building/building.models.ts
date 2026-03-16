// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type Building = components['schemas']['BuildingRead'];
export type BuildingCreate = components['schemas']['BuildingCreate'];
export type BuildingUpdate = components['schemas']['BuildingUpdate'];
