// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type UserRead = components['schemas']['UserRead'];
export type UserCreate = components['schemas']['UserCreate'];
export type UserUpdate = components['schemas']['UserUpdate'];
export type UserCommunityBrief = components['schemas']['UserCommunityBrief'];
export type RoleType = components['schemas']['RoleType'];
