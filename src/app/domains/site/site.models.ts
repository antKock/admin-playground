// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type Site = components['schemas']['SiteRead'];
export type SiteCreate = components['schemas']['SiteCreate'];
export type SiteUpdate = components['schemas']['SiteUpdate'];
export type Building = components['schemas']['BuildingRead'];
