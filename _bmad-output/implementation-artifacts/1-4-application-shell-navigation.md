# Story 1.4: Application Shell & Navigation

Status: done

## Story

As an operator (Sophie/Alex),
I want a persistent sidebar with all 7 entity sections and a header showing my login state,
so that I can navigate between entity sections efficiently and always know I'm authenticated.

## Acceptance Criteria

1. **AppLayout Rendering** — Given the user is authenticated, when they access the admin interface, then the AppLayout component renders with a sidebar (240px fixed width) on the left and a header (56px height) at the top
2. **Sidebar Navigation** — The sidebar displays navigation links for all 7 entity sections: Funding Programs, Action Themes, Action Models, Folder Models, Communities, Agents, Indicator Models
3. **Header Context** — The header displays the user's authentication context (logged-in state) and contains a logout button
4. **Lazy-Loaded Routing** — Given the user clicks a sidebar navigation link, when the route changes, then the corresponding entity section loads via lazy-loaded routing and the current section is visually highlighted in the sidebar (purple left-border + active background)
5. **Sidebar Persistence** — Given the user is on any page, the sidebar is always visible and accessible — they are never more than one click from any entity list
6. **Lazy Loading Verification** — Given 7 entity feature modules exist, when the application loads, only the active route's module is loaded
7. **Placeholder Routes** — Each entity has a placeholder route component showing the entity name (ready for Epic 2+)

## Tasks / Subtasks

- [x] Task 1: Create AppLayout Component (AC: #1, #5)
  - [x] Create `src/app/core/layout/app-layout.component.ts` (standalone)
  - [x] Create `src/app/core/layout/app-layout.component.html`
  - [x] Create `src/app/core/layout/app-layout.component.css`
  - [x] Layout structure: sidebar (fixed 240px, full height) | header (fixed 56px) | content area (flex, remaining width)
  - [x] Sidebar: `surface-subtle` (#f9f9f9) background, `stroke-standard` (#e0e0e0) right border
  - [x] Header: `surface-base` (#ffffff) background, `stroke-standard` bottom border
  - [x] Content area: fluid width (viewport - 240px), padding with `gap-6` (24px)
  - [x] Use `<nav>` element for sidebar with `aria-label="Main navigation"`
  - [x] Use `<main>` element for content area
  - [x] Include `<router-outlet>` in content area

- [x] Task 2: Implement Sidebar Navigation (AC: #2, #4)
  - [x] Define navigation items array: 7 entity sections with labels, routes, and Lucide icons
  - [x] Render navigation links using `routerLink` directive
  - [x] Active state styling: purple left-border (brand-primary #1400cc) + `surface-active` (#dde2f5) background
  - [x] Hover state: `surface-table-row-hover` (#f0f2fa) background
  - [x] Use Lucide icons for each section (e.g., DollarSign for Funding Programs, Tags for Action Themes, etc.)
  - [x] Keyboard-navigable sidebar items (tab order)
  - [x] Skip-to-content link for accessibility

- [x] Task 3: Implement Header (AC: #3)
  - [x] Display user context (e.g., email or "Logged in" indicator) — right-aligned
  - [x] Add logout button with Lucide LogOut icon
  - [x] Connect logout button to AuthService.logout()
  - [x] Style: text-secondary for user info, brand-primary for interactive elements

- [x] Task 4: Configure Lazy-Loaded Routes (AC: #4, #6, #7)
  - [x] Update `app.routes.ts` with 7 lazy-loaded entity routes:
    - `/funding-programs` → FundingPrograms feature (lazy)
    - `/action-themes` → ActionThemes feature (lazy)
    - `/action-models` → ActionModels feature (lazy)
    - `/folder-models` → FolderModels feature (lazy)
    - `/communities` → Communities feature (lazy)
    - `/agents` → Agents feature (lazy)
    - `/indicator-models` → IndicatorModels feature (lazy)
  - [x] All routes wrapped with AppLayout and protected by auth guard
  - [x] Default redirect to `/funding-programs`

- [x] Task 5: Create Placeholder Feature Components (AC: #7)
  - [x] Create 7 minimal feature directories with placeholder route components:
    - `src/app/features/funding-programs/funding-program.routes.ts` + placeholder list component
    - `src/app/features/action-themes/action-theme.routes.ts` + placeholder
    - `src/app/features/action-models/action-model.routes.ts` + placeholder
    - `src/app/features/folder-models/folder-model.routes.ts` + placeholder
    - `src/app/features/communities/community.routes.ts` + placeholder
    - `src/app/features/agents/agent.routes.ts` + placeholder
    - `src/app/features/indicator-models/indicator-model.routes.ts` + placeholder
  - [x] Each placeholder shows entity name as heading (e.g., "Funding Programs" with `text-2xl font-bold`)

- [x] Task 6: Verification & Tests
  - [x] Create `app-layout.component.spec.ts`
  - [x] Verify sidebar renders 7 navigation items
  - [x] Verify active route highlights correct sidebar item
  - [x] Verify logout button calls AuthService.logout()
  - [x] Verify lazy loading: only active route's component loaded
  - [x] Verify all placeholder routes are accessible

## Dev Notes

### Architecture Patterns & Constraints

- **Layout Model**: Sidebar (fixed 240px) + Header (fixed 56px) + Content (fluid)
- **Desktop-Only**: Minimum 1280px viewport, no responsive breakpoints, no media queries
- **Sidebar**: `<nav>` semantic element, always visible, keyboard-navigable
- **Content max-width**: None — tables and workspaces benefit from full width
- **Icons**: Lucide Angular — all icons from this library
- **Routing**: Lazy-loaded per entity using `loadChildren` or `loadComponent`
- **Auth Guard**: Applied at route level to protect all entity routes

### Sidebar Navigation Items

| Section | Route | Lucide Icon |
|---------|-------|-------------|
| Funding Programs | `/funding-programs` | `DollarSign` or `Landmark` |
| Action Themes | `/action-themes` | `Tags` or `Palette` |
| Action Models | `/action-models` | `FileText` or `LayoutTemplate` |
| Folder Models | `/folder-models` | `FolderOpen` |
| Communities | `/communities` | `Users` |
| Agents | `/agents` | `UserCog` |
| Indicator Models | `/indicator-models` | `BarChart3` or `Activity` |

### UX Specifications

- **Sidebar background**: `surface-subtle` (#f9f9f9)
- **Sidebar border**: `stroke-standard` (#e0e0e0) right border
- **Header background**: `surface-base` (#ffffff)
- **Header border**: `stroke-standard` (#e0e0e0) bottom border
- **Active nav item**: purple left-border (3px, `brand` #1400cc) + `surface-active` (#dde2f5) background
- **Hover nav item**: `surface-table-row-hover` (#f0f2fa)
- **Nav text**: `text-sm` (14px), `font-normal` (400), `text-primary` (#1a1a1a)
- **Active nav text**: `font-semibold` (600), `text-brand` (#1400cc)
- **Content padding**: `gap-6` (24px) all sides
- **Page title**: `text-2xl` (24px), `font-bold` (700)

### Files Created by This Story

```
src/app/core/layout/
├── app-layout.component.ts
├── app-layout.component.html
├── app-layout.component.css
└── app-layout.component.spec.ts

src/app/features/
├── funding-programs/
│   ├── funding-program.routes.ts
│   └── funding-program-list.component.ts (placeholder)
├── action-themes/
│   ├── action-theme.routes.ts
│   └── action-theme-list.component.ts (placeholder)
├── action-models/
│   ├── action-model.routes.ts
│   └── action-model-list.component.ts (placeholder)
├── folder-models/
│   ├── folder-model.routes.ts
│   └── folder-model-list.component.ts (placeholder)
├── communities/
│   ├── community.routes.ts
│   └── community-list.component.ts (placeholder)
├── agents/
│   ├── agent.routes.ts
│   └── agent-list.component.ts (placeholder)
└── indicator-models/
    ├── indicator-model.routes.ts
    └── indicator-model-list.component.ts (placeholder)
```

### Dependencies

- **Story 1.1**: Tailwind design tokens, project scaffold
- **Story 1.3**: AuthService (for logout, user context), AuthGuard (for route protection)

### What This Story Does NOT Create

- No shared UI components (Story 1.5)
- No entity-specific services or real list/detail views (Epic 2+)
- No filtering or data loading (Epic 2+)

### Anti-Patterns to Avoid

- DO NOT use `<div>` for navigation — use semantic `<nav>` element
- DO NOT eagerly load feature modules — lazy load everything
- DO NOT hardcode navigation items in template — use data-driven array
- DO NOT create NgModule for features — use standalone route configs
- DO NOT use `@Component({ standalone: false })` — default standalone in Angular 20

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Code Structure] — Directory layout
- [Source: _bmad-output/planning-artifacts/architecture.md#Layout Model] — Sidebar + header dimensions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AppLayout] — Component specs, spacing, colors
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Spacing & Layout] — Grid, gaps, dimensions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- All 7 ACs implemented. AppLayout with 240px sidebar, 56px header, 7 nav items with Lucide icons, lazy-loaded routes, auth guard protection, skip-to-content link, semantic HTML.

### File List

- src/app/core/layout/app-layout.component.ts — Layout with sidebar navigation
- src/app/core/layout/app-layout.component.html — Template with nav, header, main
- src/app/core/layout/app-layout.component.css — Layout styling with design tokens
- src/app/core/layout/app-layout.component.spec.ts — 8 unit tests
- src/app/features/funding-programs/funding-program-list.component.ts — Placeholder
- src/app/features/funding-programs/funding-program.routes.ts — Route config
- src/app/features/action-themes/action-theme-list.component.ts — Placeholder
- src/app/features/action-themes/action-theme.routes.ts — Route config
- src/app/features/action-models/action-model-list.component.ts — Placeholder
- src/app/features/action-models/action-model.routes.ts — Route config
- src/app/features/folder-models/folder-model-list.component.ts — Placeholder
- src/app/features/folder-models/folder-model.routes.ts — Route config
- src/app/features/communities/community-list.component.ts — Placeholder
- src/app/features/communities/community.routes.ts — Route config
- src/app/features/agents/agent-list.component.ts — Placeholder
- src/app/features/agents/agent.routes.ts — Route config
- src/app/features/indicator-models/indicator-model-list.component.ts — Placeholder
- src/app/features/indicator-models/indicator-model.routes.ts — Route config
