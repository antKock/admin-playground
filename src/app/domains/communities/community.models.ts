// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type CommunityRead = components['schemas']['CommunityRead'];
export type CommunityCreate = components['schemas']['CommunityCreate'];
export type CommunityUpdate = components['schemas']['CommunityUpdate'];
export type UserRead = components['schemas']['UserRead'];
// Lightweight user-community relationship used in community member lists.
export type UserCommunityBrief = components['schemas']['UserCommunityBrief'];
