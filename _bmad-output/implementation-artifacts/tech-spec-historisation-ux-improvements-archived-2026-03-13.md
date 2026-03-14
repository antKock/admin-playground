---
title: 'Historisation UX Improvements'
slug: 'historisation-ux-improvements'
created: '2026-03-13'
status: 'completed'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['Angular 21', 'Signals', 'Standalone Components', 'ACTEE Pattern']
files_to_modify:
  - 'src/app/domains/history/history.models.ts'
  - 'src/app/domains/history/history.api.ts'
  - 'src/app/domains/history/history.utils.ts'
  - 'src/app/features/activity-feed/ui/global-activity-feed.component.ts'
  - 'src/app/features/activity-feed/ui/activity-feed-page.component.ts'
  - 'src/app/shared/components/activity-list/activity-list.component.ts'
code_patterns: ['ACTEE (facade → store → API)', 'Signals (signal, computed, input, output)', 'Standalone components']
test_patterns: ['vitest via Angular builder', 'npx ng test --no-watch']
---

# Tech-Spec: Historisation UX Improvements

**Created:** 2026-03-13

## Overview

### Problem Statement

The activity feed in the admin playground shows flat, noisy, undifferentiated activity logs. Admins cannot:
- Distinguish model-level activity (ActionModel, IndicatorModel) from instance-level activity (Action)
- See what was created or what the entity looked like at a given point
- Understand cascade operations (creating an action with 5 indicators = 6 unrelated lines)
- See relation changes (attaching/detaching indicator models to action models)

### Solution

Five incremental improvements leveraging existing underutilized backend fields (`parent_entity_type`, `parent_entity_id`, `changes`) plus frontend grouping logic and a new `/compare` API integration. Only many-to-many relation tracking requires a backend extension (documented as prerequisite, not implemented here).

### Scope

**In Scope:**
1. Model/instance entity type toggle filter (default: show all during build phase)
2. Parent-child activity grouping with expand/collapse
3. Time-based visual grouping (same entity + user + 1min window, frontend-only)
4. On-demand detail view: "View state" snapshot + "Compare with previous" diff
5. New `/compare` API integration in Angular
6. Backend prerequisite documentation for many-to-many tracking

**Out of Scope:**
- Backend changes (historisation engine modifications)
- Restore/rollback functionality
- Batch ID / transaction grouping at the data level
- Instance-specific entity CRUD pages
- Any new entity detail pages

## Context for Development

### Codebase Patterns

- **ACTEE pattern**: View (Component) → Facade → Store → API → HTTP
- **Signals**: All state management uses Angular signals (`signal`, `computed`, `input`, `output`)
- **Standalone components**: No NgModules
- **Path aliases**: `@app/`, `@shared/`, `@domains/`, `@features/`, `@core/`
- **Date formatting**: `formatDateFr()` from `@app/shared/utils/format-date`
- **Activity response**: `ActivityResponse` from OpenAPI types already includes `parent_entity_type`, `parent_entity_id`, `parent_entity_name` fields

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/app/domains/history/history.models.ts` | EntityType union, ActivityFilters, ActionType |
| `src/app/domains/history/history.api.ts` | API loaders: `entityActivityLoader()`, `globalActivityLoader()` |
| `src/app/domains/history/history.store.ts` | GlobalHistoryStore (singleton) + HistoryStore (local) |
| `src/app/domains/history/history.utils.ts` | `entityRoute()`, `actionLabel()`, `actionBadgeClass()` |
| `src/app/features/activity-feed/activity-feed.facade.ts` | Global feed facade: load, loadMore, reset |
| `src/app/features/activity-feed/ui/global-activity-feed.component.ts` | Slide-out panel with filters + infinite scroll |
| `src/app/features/activity-feed/ui/activity-feed-page.component.ts` | Full-page DataTable view |
| `src/app/shared/components/activity-list/activity-list.component.ts` | Embedded entity-specific activity list |
| `docs/historisation_analyse_recap.md` | Analysis recap with 5 identified problems |
| `docs/historisation_debrief_questions.md` | Initial debrief questions |

### Technical Decisions

- **Toggle default**: Show all activity (build phase). Will flip to "models only" in future.
- **Entity type distinction**: `entity_type` values differentiate model vs instance (e.g., `ActionModel` vs `Action`). The toggle filters on this.
- **Time grouping**: Frontend-only presentation concern. Group key = `(entity_id OR parent_entity_id) + user_id + 1min window`. Configurable constant. Max 10 items per group before "and N more...".
- **On-demand detail**: Two complementary views — "View state" (full snapshot) and "Compare with previous" (diff via `/compare` endpoint). Creation events only show "View state".
- **Parent-child**: Use existing `parent_entity_*` fields. Global feed: "Created Indicator Y (part of Action X)". Parent feed: "Created Action X (with 5 indicators)" expandable.

## Implementation Plan

### Tasks

- [x] 1. Model/instance entity type toggle filter with pill buttons (All / Models / Instances)
- [x] 2. Parent-child activity grouping with expand/collapse in slide-out panel
- [x] 3. Time-based visual grouping utility (entity + user + 1min window, max 10 visible)
- [x] 4. On-demand detail view: "View state" snapshot + "Compare with previous" diff drawer
- [x] 5. `/compare` and `/at/{date}` API integration in Angular

### Acceptance Criteria

- [x] Category toggle filters activities by model vs instance entity types (client-side)
- [x] Parent-child grouping shows cascade operations with expand/collapse
- [x] Child activities display "(partie de X)" parent reference
- [x] Time grouping utility groups same entity + user within 1min window
- [x] "View state" button loads entity snapshot at activity date via `/at/{date}`
- [x] "Compare" button loads diff via `/compare` endpoint (hidden for create actions)
- [x] Category toggle present on both slide-out panel and full-page DataTable view
- [x] Full-page view shows "Parent" column for parent entity references
- [x] All existing tests still pass, new tests added for utils and API functions

## Additional Context

### Dependencies

**Backend prerequisites (not in scope — document only):**
- `parent_entity_type` / `parent_entity_id` must be populated systematically on cascade operations
- `changes` field must be populated on CREATE events (if systematic storage decided)
- Many-to-many relation tracking via `sqlalchemy.inspect(obj).attrs[relation].history`
- `/compare` endpoint must be available and documented (already exists per backend docs)

### Testing Strategy

- Unit tests for all new/modified stores, utils, and components
- Run with `npx ng test --no-watch`
- Build check with `npx ng build`

### Notes

- Priority order: 1 (toggle filter) → 2 (parent-child) → 3 (time grouping) → 4 (relation tracking display) → 5 (on-demand detail + compare)
- Party mode discussion (2026-03-13) with PM, UX Designer, and Architect informed all decisions
- Reference: `docs/historisation_analyse_recap.md` for full problem analysis

## Review Notes

- Adversarial review completed
- Findings: 13 total, 10 fixed, 3 skipped (noise/by-design)
- Resolution approach: auto-fix all confirmed real issues
- Fixed: subscription leaks (takeUntilDestroyed), template safety (@if alias), duplicate constants extraction, named interfaces, type-safe MODEL_ENTITY_TYPES, error message sanitization, compare date precision, groupByTime wired into activity-list
