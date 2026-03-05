// Thin re-exports over generated OpenAPI types (see src/app/core/api/generated/api-types.ts).
// Regenerate with: bash scripts/generate-api-types.sh
import { components } from '@app/core/api/generated/api-types';

export type AgentRead = components['schemas']['AgentRead'];
export type AgentCreate = components['schemas']['AgentCreate'];
export type AgentUpdate = components['schemas']['AgentUpdate'];
export type AgentType = components['schemas']['AgentType'];
// Status enum for the agent lifecycle workflow (e.g. draft → active → inactive).
export type AgentStatus = components['schemas']['AgentStatus'];
// Describes an allowed status transition: target status + whether it's currently permitted.
export type AgentNextStatusInfo = components['schemas']['AgentNextStatusInfo'];
