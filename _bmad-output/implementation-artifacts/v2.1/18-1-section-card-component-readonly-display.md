# Story 18.1: Section-Card Component & Read-Only Section Display

Status: review

## Story

As an admin,
I want to see indicators organized into sections on the action-model detail page,
So that I can understand how the action model is structured at a glance.

## Acceptance Criteria

1. **Shared section-card component renders correctly**
   - Given the shared `section-card` component is implemented
   - When it is rendered with a section name, type, and indicator list
   - Then it displays a bordered card (`bg-gray-50`, `border-l-4` accent) with a header showing the section name and a collapse/expand toggle
   - And when collapsed, it shows an indicator count badge (e.g. "3 indicateurs")
   - And when expanded, it shows a section params area (⚙ icon, dotted separator) and the list of indicator cards inside

2. **Action model detail displays sections from API response**
   - Given an action model has sections returned in `ActionModelRead.sections` (typed as `SectionModelWithIndicators[]`)
   - When the admin views the action-model detail page
   - Then association sections (`association_sites`, `association_agents`, `association_communities`) are displayed under "Sections d'association"
   - And fixed sections (`application`, `progress`) are displayed under "Sections"
   - And each section renders its indicators using the existing `indicator-card` component

3. **Section indicators display with correct types**
   - Given a section has indicators (`SectionIndicatorModelRead[]`)
   - When the section is expanded
   - Then each indicator displays name, type, unit, and param hint icons
   - And child indicators are displayed nested inside their parent indicator card

## Tasks / Subtasks

- [x] Task 1: Create shared `section-card` component (AC: #1)
  - [x] 1.1 Create `src/app/shared/components/section-card/section-card.component.ts` — standalone component
  - [x] 1.2 Inputs: `sectionName: string`, `sectionType: SectionType`, `indicatorCount: number`, `collapsed: boolean`, `showParams: boolean`
  - [x] 1.3 Outputs: `toggleCollapse`, `indicatorAdd`, `indicatorRemove`
  - [x] 1.4 Template: bordered card with `bg-gray-50 border-l-4 border-blue-400` styling
  - [x] 1.5 Header: section name + icon (per type) + collapse toggle button + indicator count badge when collapsed
  - [x] 1.6 Body (when expanded): section params slot (⚙ icon + dotted separator `border-t border-dotted`) + indicator list via `ng-content` or projected content
  - [x] 1.7 Write unit tests for collapse/expand toggle, badge display, content projection

- [x] Task 2: Create section-card type mappings (AC: #1, #2)
  - [x] 2.1 Create `src/app/shared/components/section-card/section-card.models.ts` — section type to French label/icon mapping
  - [x] 2.2 Map: `association_sites` → "Sites" 🏠, `association_agents` → "Agents" 👤, `association_communities` → "Communautés" 🏘, `application` → "Candidature" 📋, `progress` → "Suivi" 📈, `additional_info` → "Informations complémentaires" 📎

- [x] Task 3: Extend action-model detail to display sections (AC: #2, #3)
  - [x] 3.1 Add `sections` computed signal to `ActionModelFeatureStore` — projects `selectedItem()?.sections` grouped by association vs fixed
  - [x] 3.2 Add `associationSections` and `fixedSections` computed signals to facade
  - [x] 3.3 Update `action-model-detail.component.ts` — add section-card rendering after existing metadata/properties section
  - [x] 3.4 Update `action-model-detail.component.html` — "Sections d'association" heading with association section cards, "Sections" heading with fixed section cards
  - [x] 3.5 Render `SectionIndicatorModelRead` indicators using existing `indicator-card` — map section indicator fields to `IndicatorCardData`

- [x] Task 4: Create section indicator to card mapping utility (AC: #3)
  - [x] 4.1 Create `src/app/features/action-models/use-cases/build-section-indicator-cards.ts` — pure function mapping `SectionIndicatorModelRead[]` to `IndicatorCardData[]`
  - [x] 4.2 Handle parent-child hierarchy (SectionChildIndicatorModelRead mapped as children)
  - [x] 4.3 Write unit tests for the mapping function

- [x] Task 5: Update section anchors and page structure (AC: #2)
  - [x] 5.1 Update `sectionDefs` computed in detail component to include section headings
  - [x] 5.2 Ensure sections render in correct order: Properties → Sections d'association → Sections → Activité

## Dev Notes

### Architecture & Patterns

- **ACTEE pattern**: section-card is a shared component (presentation-only), used by multiple feature facades
- **Signal-only components**: use `input()`, `output()`, `computed()`, `signal()` — no Observables
- **Existing indicator-card reuse**: `SectionIndicatorModelRead` has same core fields as `IndicatorModelWithAssociation` but different structure — needs a mapping utility
- **No domain store changes in this story** — read-only display only; sections data comes from `ActionModelRead.sections` which is already loaded by the existing `selectById` rxMethod

### API Types Reference

```typescript
// SectionModelWithIndicators — what ActionModelRead.sections contains
interface SectionModelWithIndicators {
  id: string;
  name: string;
  section_type: SectionType; // "application" | "progress" | "association_sites" | "association_agents" | "association_communities" | "additional_info"
  owner_type: SectionOwnerType;
  owner_id: string;
  is_enabled: boolean;
  position: number;
  hidden_rule: string;
  required_rule: string;
  // ... other rule fields
  indicators?: SectionIndicatorModelRead[];
}

// SectionIndicatorModelRead — indicators within a section
interface SectionIndicatorModelRead {
  id: string;
  name: string;
  technical_label: string;
  type: string;
  unit?: string | null;
  hidden_rule: string;
  required_rule: string;
  disabled_rule: string;
  default_value_rule: string;
  duplicable_rule: string;
  constrained_rule: string;
  position: number;
  children?: SectionChildIndicatorModelRead[] | null;
}
```

### Project Structure Notes

- New shared component: `src/app/shared/components/section-card/`
- New use-case: `src/app/features/action-models/use-cases/build-section-indicator-cards.ts`
- Modified files: `action-model-detail.component.ts`, `action-model-detail.component.html`, `action-model.store.ts` (feature), `action-model.facade.ts`
- Path aliases: `@shared/components/section-card/section-card.component`

### Critical Guardrails

- **DO NOT** create a new domain store — sections are embedded in `ActionModelRead.sections`
- **DO NOT** add new API calls — section data is already in the action model detail response
- **DO NOT** modify `indicator-card` component — create a mapping utility instead
- **Reuse** `ParamHintIconsComponent` for section indicator param display
- **French labels**: all user-visible text in French (section names, badge text like "X indicateurs")
- The section-card must be generic enough for reuse in Epics 19 (folder models) and 20 (entity models)

### Testing Standards

- Unit tests with `npx ng test --no-watch`
- Test section-card: collapse/expand, indicator count badge, content projection
- Test mapping utility: `SectionIndicatorModelRead[]` → `IndicatorCardData[]` conversion
- Test computed signals in feature store for section grouping

### References

- [Source: temp/sections-feature-plan.md#Phase 1 — Section Management on Action Models]
- [Source: _bmad-output/planning-artifacts/v2.1/epics.md#Story 18.1]
- [Source: src/app/shared/components/indicator-card/indicator-card.component.ts]
- [Source: src/app/features/action-models/ui/action-model-detail.component.ts]
- [Source: src/app/core/api/generated/api-types.ts — SectionModelWithIndicators, SectionIndicatorModelRead]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Used `linkedSignal` (Angular 19+) to resolve NG0100 ExpressionChangedAfterItHasBeenChecked in section-card collapse state management
- Section indicators rendered read-only using `ParamHintIconsComponent` directly (not full indicator-card) since sections are display-only in this story

### Completion Notes List

- Created reusable `section-card` shared component with collapse/expand, type icon mapping, content projection, and a11y support
- Created `section-card.models.ts` with SectionType config map and association section helpers
- Created `build-section-indicator-cards.ts` mapping utility converting `SectionIndicatorModelRead[]` → `IndicatorCardData[]` with child hierarchy support
- Extended `ActionModelFeatureStore` with `associationSections` and `fixedSections` computed signals
- Extended `ActionModelFacade` to expose section signals
- Updated `action-model-detail` component and template to render sections grouped by association vs fixed, with section-card components
- Updated `sectionDefs` to dynamically include section headings in page navigation
- All 1198 tests pass, 0 lint errors, build succeeds

### Change Log

- 2026-03-25: Story 18.1 implemented — section-card component, type mappings, section indicator mapping, detail page integration
- 2026-03-25: Code review fixes — removed dead `showParams` input from section-card, converted template method calls to pre-computed signals, removed incorrect type casts in feature store

### File List

New files:
- src/app/shared/components/section-card/section-card.component.ts
- src/app/shared/components/section-card/section-card.component.html
- src/app/shared/components/section-card/section-card.component.spec.ts
- src/app/shared/components/section-card/section-card.models.ts
- src/app/features/action-models/use-cases/build-section-indicator-cards.ts
- src/app/features/action-models/use-cases/build-section-indicator-cards.spec.ts

Modified files:
- src/app/features/action-models/action-model.store.ts (feature store — added associationSections/fixedSections computed)
- src/app/features/action-models/action-model.facade.ts (exposed section signals)
- src/app/features/action-models/ui/action-model-detail.component.ts (imports, section signals, sectionDefs, getSectionIndicatorCards)
- src/app/features/action-models/ui/action-model-detail.component.html (section-card rendering)
