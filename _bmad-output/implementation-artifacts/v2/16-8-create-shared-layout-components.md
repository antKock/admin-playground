# Story 16.8: Create Shared Layout Components

Status: ready-for-dev

## Story

As a developer,
I want reusable layout components for list, detail, and form pages,
so that I don't duplicate structural patterns across 7+ domains.

## Acceptance Criteria

1. A `ListPageLayoutComponent` exists at `src/app/shared/components/layouts/` encapsulating the common list page structure
2. A `DetailPageLayoutComponent` exists encapsulating the common detail page structure
3. A `FormPageLayoutComponent` exists encapsulating the common form page structure
4. At least one existing list component is migrated as proof of concept
5. At least one existing detail component is migrated as proof of concept
6. At least one existing form component is migrated as proof of concept
7. `npx ng build` and `npx ng test --no-watch` both pass

## Tasks / Subtasks

- [ ] Task 1: Create ListPageLayoutComponent (AC: #1)
  - [ ] 1.1 Analyze common list page pattern across components:
    - Title bar with page title + "Create" button
    - Optional filter/search area
    - `<app-data-table>` slot
    - "Load more" pagination button (cursor-based)
    - Empty state with `hasLoaded` guard (shows "Aucun element" only after initial load)
  - [ ] 1.2 Create `src/app/shared/components/layouts/list-page-layout.component.ts`:
    - Standalone component, `changeDetection: OnPush`
    - Inputs: `title: string`, `createLabel: string` (default: 'Creer'), `createRoute: string`, `hasLoaded: boolean`, `isEmpty: boolean`, `hasMore: boolean`, `emptyMessage: string` (default: 'Aucun element trouve')
    - Outputs: `loadMore: EventEmitter<void>`
    - Content projection slots: `[filters]` for filter area, `[table]` for DataTable
    - Template uses `<ng-content select="[filters]">` and `<ng-content select="[table]">`
  - [ ] 1.3 Create `src/app/shared/components/layouts/list-page-layout.component.html`
  - [ ] 1.4 Create `src/app/shared/components/layouts/list-page-layout.component.css`
  - [ ] 1.5 Create `src/app/shared/components/layouts/list-page-layout.component.spec.ts`

- [ ] Task 2: Create DetailPageLayoutComponent (AC: #2)
  - [ ] 2.1 Analyze common detail page pattern:
    - `<app-breadcrumb>` navigation
    - Skeleton/loading state
    - `<app-metadata-grid>` for entity metadata
    - Content sections (varies per domain)
    - Action buttons: Edit, Delete (with confirm dialog)
  - [ ] 2.2 Create `src/app/shared/components/layouts/detail-page-layout.component.ts`:
    - Standalone component, `changeDetection: OnPush`
    - Inputs: `breadcrumbs: BreadcrumbItem[]`, `isLoading: boolean`, `title: string`
    - Outputs: `edit: EventEmitter<void>`, `delete: EventEmitter<void>`
    - Content projection slots: `[metadata]`, `[sections]`, `[actions]`
    - Includes `<app-breadcrumb>` and skeleton loading state
  - [ ] 2.3 Create `src/app/shared/components/layouts/detail-page-layout.component.html`
  - [ ] 2.4 Create `src/app/shared/components/layouts/detail-page-layout.component.css`
  - [ ] 2.5 Create `src/app/shared/components/layouts/detail-page-layout.component.spec.ts`

- [ ] Task 3: Create FormPageLayoutComponent (AC: #3)
  - [ ] 3.1 Analyze common form page pattern:
    - `<app-breadcrumb>` navigation
    - `<form>` element with `[formGroup]` (handled by consumer)
    - `<app-save-bar>` at bottom with save/cancel
    - `Cmd+S` / `Ctrl+S` keyboard shortcut for save
    - `Escape` key for cancel/navigate back
    - `HasUnsavedChanges` guard integration (canDeactivate)
  - [ ] 3.2 Create `src/app/shared/components/layouts/form-page-layout.component.ts`:
    - Standalone component, `changeDetection: OnPush`
    - Inputs: `breadcrumbs: BreadcrumbItem[]`, `isSaving: boolean`, `isDirty: boolean`, `title: string`
    - Outputs: `save: EventEmitter<void>`, `cancel: EventEmitter<void>`
    - Content projection: `<ng-content>` for the form content
    - Includes `<app-breadcrumb>`, `<app-save-bar>`
    - Use `host:` property in `@Component` decorator for `Cmd+S` and `Escape` keyboard listeners (preferred over `@HostListener`)
  - [ ] 3.3 Create `src/app/shared/components/layouts/form-page-layout.component.html`
  - [ ] 3.4 Create `src/app/shared/components/layouts/form-page-layout.component.css`
  - [ ] 3.5 Create `src/app/shared/components/layouts/form-page-layout.component.spec.ts`

- [ ] Task 4: Migrate one list component as PoC — agent-list (AC: #4)
  - [ ] 4.1 Refactor `src/app/features/agents/ui/agent-list.component.ts` to use `ListPageLayoutComponent`
  - [ ] 4.2 Replace structural template boilerplate with:
    ```html
    <app-list-page-layout title="Agents" createRoute="/agents/create" [hasLoaded]="hasLoaded()" [isEmpty]="agents().length === 0" [hasMore]="hasMore()" (loadMore)="onLoadMore()">
      <div filters><!-- search/filter inputs --></div>
      <app-data-table table [columns]="columns" [rows]="rows()" />
    </app-list-page-layout>
    ```
  - [ ] 4.3 Update `agent-list.component.spec.ts`

- [ ] Task 5: Migrate one detail component as PoC — agent-detail (AC: #5)
  - [ ] 5.1 Refactor `src/app/features/agents/ui/agent-detail.component.ts` to use `DetailPageLayoutComponent`
  - [ ] 5.2 Replace structural template boilerplate with layout component + content slots
  - [ ] 5.3 Update `agent-detail.component.spec.ts`

- [ ] Task 6: Migrate one form component as PoC — agent-form (AC: #6)
  - [ ] 6.1 Refactor `src/app/features/agents/ui/agent-form.component.ts` to use `FormPageLayoutComponent`
  - [ ] 6.2 Replace breadcrumb + save-bar + keyboard shortcut boilerplate with layout component
  - [ ] 6.3 Update `agent-form.component.spec.ts`

- [ ] Task 7: Run `npx ng build` and `npx ng test --no-watch` (AC: #7)

## Dev Notes

- **Design philosophy**: These are LAYOUT components, not over-engineered generic frameworks. They use content projection (`<ng-content>`) and named slots — NOT config objects or render callbacks.
- **Content projection slots** use attribute selectors: `<ng-content select="[filters]">`, `<ng-content select="[table]">`, etc. This is Angular's standard approach for multi-slot projection.
- **Do NOT abstract away domain-specific logic**. Each domain still owns its columns, rows, metadata config, form fields. The layouts only handle the STRUCTURAL shell (breadcrumb placement, button positioning, loading states, keyboard shortcuts).
- **List pages using this pattern** (for future full migration after PoC):
  - agent-list, building-list, community-list, folder-model-list, action-theme-list, action-model-list, indicator-model-list, user-list, funding-program-list
  - Note: `site-list` may have a different pattern — verify before migrating
- **Detail pages**: All 10 domain detail components follow the same breadcrumb + metadata + sections + actions pattern
- **Form pages**: All form components have breadcrumb + form + save-bar + Cmd+S + Escape + canDeactivate guard
- **Keyboard shortcut consolidation**: Currently every form component has its own `@HostListener('document:keydown', ['$event'])` for Cmd+S and Escape. The `FormPageLayoutComponent` centralizes this.
- **HasUnsavedChanges guard**: The layout component should expose `isDirty` as an input so the guard can check it. The guard itself remains at route level.
- **PoC scope**: Only migrate the agent domain (list + detail + form) as proof of concept. **Full migration of all remaining domains (8-9 per layout) is explicitly out of scope and should be tracked as a separate follow-up story or epic.** Do not scope-creep into migrating other domains.
- **Story size note**: This story creates 3 new components + 3 PoC migrations. It is the largest story in E16. If effort exceeds expectations, prioritize completing all 3 layout components with tests before starting PoC migrations.

### Project Structure Notes

- **Create**: `src/app/shared/components/layouts/list-page-layout.component.ts` + html + css + spec
- **Create**: `src/app/shared/components/layouts/detail-page-layout.component.ts` + html + css + spec
- **Create**: `src/app/shared/components/layouts/form-page-layout.component.ts` + html + css + spec
- **Modify**: `src/app/features/agents/ui/agent-list.component.ts` + spec (PoC)
- **Modify**: `src/app/features/agents/ui/agent-detail.component.ts` + spec (PoC)
- **Modify**: `src/app/features/agents/ui/agent-form.component.ts` + spec (PoC)

### References

- [Source: docs/architecture-ACTEE.md]
- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 16.8]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
