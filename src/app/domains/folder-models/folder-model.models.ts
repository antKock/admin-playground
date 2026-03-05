// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type FolderModel = components['schemas']['FolderModelRead'];
export type FolderModelCreate = components['schemas']['FolderModelCreate'];
export type FolderModelUpdate = components['schemas']['FolderModelUpdate'];
