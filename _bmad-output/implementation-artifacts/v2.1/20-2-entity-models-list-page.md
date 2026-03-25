# Story 20.2: Entity Models List Page

Status: ready-for-dev

## Story

As an admin,
I want to see all three entity model types displayed as cards on a single page,
So that I can quickly identify and navigate to the entity model I want to configure.

## Acceptance Criteria

1. **Three clickable cards displayed**
   - Given the admin navigates to `/entity-models`
   - When the entity models are loaded from `GET /entity-models/`
   - Then three clickable cards are displayed in a grid layout
   - And each card shows the entity type icon, French label (Communautés, Agents, Sites), and indicator count from its additional_info section

2. **Card click navigates to detail**
   - Given the entity models list page is displayed
   - When the admin clicks on a card
   - Then they are navigated to `/entity-models/{entityType}` (e.g. `/entity-models/community`)

3. **Loading state with hasLoaded guard**
   - Given the entity models are loading
   - When the API call is in progress
   - Then a loading state is displayed
   - And the `hasLoaded` signal guard prevents showing an empty state prematurely

## Tasks / Subtasks

- [ ] Task 1: Create entity model card display data (AC: #1)
  - [ ] 1.1 Define `EntityModelCardData` type: `{ entityType: EntityModelType, label: string, icon: string, indicatorCount: number, route: string }`
  - [ ] 1.2 Create mapping in feature store or facade: `community` → "Communautés" 🏘, `agent` → "Agents" 👤, `site` → "Sites" 🏠
  - [ ] 1.3 Indicator count: extract from `entity.sections?.find(s => s.section_type === 'additional_info')?.indicators?.length ?? 0`

- [ ] Task 2: Implement entity-model list component (AC: #1, #2, #3)
  - [ ] 2.1 Implement `src/app/features/entity-models/ui/entity-model-list.component.ts` (replace placeholder from Story 20.1)
  - [ ] 2.2 Use `list-page-layout` shared component for page shell (title: "Modèles d'entités", no create button)
  - [ ] 2.3 Three cards in a responsive CSS grid: `grid grid-cols-1 md:grid-cols-3 gap-6`
  - [ ] 2.4 Each card: rounded, shadow, hover effect, cursor-pointer, padding
  - [ ] 2.5 Card content: icon (large, centered), French label (bold), indicator count subtitle
  - [ ] 2.6 Click handler: `router.navigate(['/entity-models', card.entityType])`
  - [ ] 2.7 `hasLoaded` signal: `computed(() => facade.items().length > 0 || !facade.isLoading())`

- [ ] Task 3: Add facade load method integration (AC: #3)
  - [ ] 3.1 Call `facade.loadAll()` in `ngOnInit`
  - [ ] 3.2 Add `hasLoaded` computed to facade or component
  - [ ] 3.3 Show loading skeleton while `isLoading()` is true and `!hasLoaded()`
  - [ ] 3.4 Show cards once `hasLoaded()` is true

- [ ] Task 4: Write tests (AC: #1, #2, #3)
  - [ ] 4.1 Test 3 cards render with correct labels and icons
  - [ ] 4.2 Test card click navigates to correct route
  - [ ] 4.3 Test loading state shows skeleton
  - [ ] 4.4 Test hasLoaded guard prevents premature empty state
  - [ ] 4.5 Test indicator count extraction from sections

## Dev Notes

### Architecture & Patterns

- **No DataTable**: this is the only list page that uses cards instead of a table. The page is simple — 3 fixed cards, no filtering, no pagination, no sorting.
- **list-page-layout**: reuse the shared layout but without the "Créer" button (entity models can't be created)
- **Indicator count**: entity models have a single `additional_info` section. The indicator count comes from `sections[0].indicators.length`. Handle the case where sections is empty/undefined.
- **Card component**: inline in the list component (not a separate shared component) — too simple to warrant extraction.

### French Labels & Icons

| EntityModelType | French Label | Icon |
|-----------------|-------------|------|
| `community` | Communautés | 🏘 |
| `agent` | Agents | 👤 |
| `site` | Sites | 🏠 |

### Project Structure Notes

- Modified: `src/app/features/entity-models/ui/entity-model-list.component.ts` (implement fully)
- Modified: `src/app/features/entity-models/entity-model.store.ts` (entityModelCards computed if not done in 20.1)
- No new files expected — builds on Story 20.1 scaffolding

### Critical Guardrails

- **DO NOT** use `DataTable` — this is a card grid, not a table
- **DO NOT** create a separate card component — inline the card markup in the list template
- **DO NOT** add create/delete functionality — entity models are fixed (community, agent, site)
- **hasLoaded guard** is mandatory per CLAUDE.md conventions for list components
- **Responsive grid**: 1 column on mobile, 3 columns on medium+ screens

### Dependencies

- Story 20.1 (domain store, feature store, routing, navbar)

### References

- [Source: temp/sections-feature-plan.md#Phase 3 — List page — 3 cards]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 20.2]
- [Source: src/app/shared/components/layouts/list-page-layout.component.ts]
- [Source: src/app/features/action-models/ui/action-model-list.component.ts — hasLoaded pattern]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
