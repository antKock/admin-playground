// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type FundingProgram = components['schemas']['FundingProgramRead'];
export type FundingProgramCreate = components['schemas']['FundingProgramCreate'];
export type FundingProgramUpdate = components['schemas']['FundingProgramUpdate'];
