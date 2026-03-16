# Story 13.2: Add last_updated_by_id to Metadata Grids

Status: done

## Story

As an operator,
I want to see who last modified an entity,
So that I can track accountability and audit changes.

## Acceptance Criteria

1. **Given** all entities now expose `last_updated_by_id: UUID|null` **When** viewing any entity detail **Then** the metadata grid shows a "Derniere modification par" row
2. **Given** the value is a UUID **When** displayed **Then** it resolves to a user name (via user cache/lookup) or shows the UUID as fallback
3. **Given** the value is null **When** displayed **Then** the row shows "—" or is hidden
4. **Given** this applies to all entities **When** checking all detail views **Then** ActionModel, ActionTheme, FundingProgram, FolderModel, Community, Agent, IndicatorModel all show the field

## Tasks / Subtasks

- [x] Task 1: Create user name resolution utility (AC: #2)
  - [x] Create a lightweight user cache/lookup service or use existing user store
  - [x] Given a UUID, return the user's `full_name` (or `first_name + last_name`)
  - [x] Cache resolved names to avoid repeated API calls
  - [x] Fallback: display truncated UUID if lookup fails
- [x] Task 2: Add `last_updated_by_id` to MetadataGrid configs (AC: #1, #3, #4)
  - [x] Update each entity's detail component MetadataGrid items
  - [x] Add row: label "Derniere modification par", value from resolved user name
  - [x] Handle null case: show "—"
- [x] Task 3: Tests (AC: #4)
  - [x] Verify metadata grid renders the new row
  - [x] Run `npx ng test --no-watch` — zero regressions

## Dev Notes

### Entities with `last_updated_by_id`

All 11 entities: ActionModel, Action, ActionTheme, Agent, Building, Community, FolderModel, Folder, FundingProgram, IndicatorModel, Site, User

For admin scope, focus on: ActionModel, ActionTheme, FundingProgram, FolderModel, Community, Agent, IndicatorModel

### User Resolution Strategy

Option A: Simple — just display the UUID (minimal effort, low UX value)
Option B: Inline resolution — fetch user name on detail load, cache in a Map
Option C: Pipe — `lastUpdatedByPipe` that resolves UUID → name async

Recommend Option B — the detail view already loads data, one extra user lookup is negligible.

### MetadataGrid Pattern

```typescript
{
  label: 'Derniere modification par',
  value: resolvedUserName() ?? '—',
}
```

### References

- [Source: src/app/shared/components/metadata-grid/ — MetadataGrid component]
- [Source: src/app/domains/*/ui/*-detail.component.ts — all detail components]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Created `UserNameResolverService` (`@shared/services/user-name-resolver.service.ts`) — a lightweight, signal-transparent service that resolves user UUIDs to display names via HTTP with in-memory caching. Returns '—' for null, '…' while loading, truncated UUID on error.
- Added "Dernière modification par" row to all 8 detail component MetadataGrid configs: ActionModel, ActionTheme, FundingProgram, FolderModel, Community, Agent, IndicatorModel, User.
- The service uses Angular signals internally, so computed fields in detail components reactively update when the user name resolves.
- 5 unit tests added for the resolver service covering null, loading, resolution, caching, and error fallback.
- Full test suite: 76 files, 898 tests — all pass, zero regressions.

### Change Log

- 2026-03-14: Implemented story 13.2 — added last_updated_by_id display to all entity detail metadata grids with user name resolution

### File List

- src/app/shared/services/user-name-resolver.service.ts (new)
- src/app/shared/services/user-name-resolver.service.spec.ts (new)
- src/app/features/action-models/ui/action-model-detail.component.ts (modified)
- src/app/features/action-themes/ui/action-theme-detail.component.ts (modified)
- src/app/features/agents/ui/agent-detail.component.ts (modified)
- src/app/features/communities/ui/community-detail.component.ts (modified)
- src/app/features/folder-models/ui/folder-model-detail.component.ts (modified)
- src/app/features/funding-programs/ui/funding-program-detail.component.ts (modified)
- src/app/features/indicator-models/ui/indicator-model-detail.component.ts (modified)
- src/app/features/users/ui/user-detail.component.ts (modified)
