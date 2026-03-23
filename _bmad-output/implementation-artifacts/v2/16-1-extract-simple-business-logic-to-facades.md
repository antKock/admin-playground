# Story 16.1: Extract Simple Business Logic to Facades

Status: ready-for-dev

## Story

As a developer,
I want component-level filtering and label logic moved into facades and shared utilities,
so that UI components contain only display logic and facade calls.

## Acceptance Criteria

1. `filteredUsers` computed is moved from `community-users.component.ts` to `CommunityFacade`
2. Duplicated `agentTypeLabels` mapping is extracted to `shared/utils/agent-labels.ts` and used by both agent-detail and agent-list
3. Row transformation logic with label mapping is moved from agent-list to `AgentFacade`
4. All existing tests pass with zero regressions

## Tasks / Subtasks

- [ ] Task 1: Extract `filteredUsers` computed from community-users to CommunityFacade (AC: #1)
  - [ ] 1.1 Analyze `filteredUsers` dependencies in `community-users.component.ts` (~line 108-116) — it filters `communityUsers` by name/email matching a search query signal
  - [ ] 1.2 Add `getFilteredCommunityUsers(query: Signal<string>)` or a `filteredCommunityUsers` computed to `CommunityFacade`
  - [ ] 1.3 Update `community-users.component.ts` to consume the facade signal instead of computing locally
  - [ ] 1.4 Remove the local `filteredUsers` computed from the component

- [ ] Task 2: Create `shared/utils/agent-labels.ts` with agentTypeLabels map (AC: #2)
  - [ ] 2.1 Create `src/app/shared/utils/agent-labels.ts` exporting `agentTypeLabels: Record<string, string>` map (`energy_performance_advisor` -> `'Conseiller en performance energetique'`, `other` -> `'Autre'`)
  - [ ] 2.2 Export a helper function `getAgentTypeLabel(type: string): string` that falls back to the raw type if not in the map
  - [ ] 2.3 Create `src/app/shared/utils/agent-labels.spec.ts` with unit tests

- [ ] Task 3: Update both agent-detail and agent-list to import from shared utility (AC: #2)
  - [ ] 3.1 Update `agent-detail.component.ts` (~line 146-153) to import `getAgentTypeLabel` from `@shared/utils/agent-labels`
  - [ ] 3.2 Update `agent-list.component.ts` (~line 93-96) to import `getAgentTypeLabel` from `@shared/utils/agent-labels`
  - [ ] 3.3 Remove inline `agentTypeLabels` definitions from both components

- [ ] Task 4: Extract row transformation from agent-list to AgentFacade (AC: #3)
  - [ ] 4.1 Analyze row transformation logic in `agent-list.component.ts` that maps agents to display rows with label mappings
  - [ ] 4.2 Add `formattedAgentRows` computed or method to `AgentFacade` using `getAgentTypeLabel`
  - [ ] 4.3 Update `agent-list.component.ts` to consume facade rows instead of transforming locally

- [ ] Task 5: Adapt all existing tests to new locations (AC: #4)
  - [ ] 5.1 Update `community-users.component.spec.ts` — mock facade's filtered users signal
  - [ ] 5.2 Update `agent-detail.component.spec.ts` — remove inline label test, verify shared util import
  - [ ] 5.3 Update `agent-list.component.spec.ts` — mock facade's formatted rows
  - [ ] 5.4 Add facade-level tests for the extracted logic in respective facade spec files

- [ ] Task 6: Run `npx ng test --no-watch` and verify zero regressions (AC: #4)

## Dev Notes

- **ACTEE golden rule**: UI components speak only to facade. No business logic (filtering, label mapping) in components.
- The `filteredUsers` computed in community-users currently depends on a local `searchQuery` signal — the facade method will need to accept a query parameter or expose a `setSearchQuery` method.
- `agentTypeLabels` is duplicated verbatim in two components — a clear DRY violation on top of ACTEE violation.
- Pattern: facade exposes readonly signals for display data; components just bind to them.

### Project Structure Notes

- **Create**: `src/app/shared/utils/agent-labels.ts`
- **Create**: `src/app/shared/utils/agent-labels.spec.ts`
- **Modify**: `src/app/features/communities/community.facade.ts` — add filtered users logic
- **Modify**: `src/app/features/communities/ui/community-users.component.ts` — remove local filtering
- **Modify**: `src/app/features/agents/agent.facade.ts` — add formatted rows logic
- **Modify**: `src/app/features/agents/ui/agent-detail.component.ts` — use shared label util
- **Modify**: `src/app/features/agents/ui/agent-list.component.ts` — use shared label util + facade rows

### References

- [Source: docs/architecture-ACTEE.md]
- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 16.1]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
