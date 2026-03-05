// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type ActionTheme = components['schemas']['ActionThemeRead'];
export type ActionThemeCreate = components['schemas']['ActionThemeCreate'];
export type ActionThemeUpdate = components['schemas']['ActionThemeUpdate'];
export type ActionThemeStatus = components['schemas']['ActionThemeStatus'];
