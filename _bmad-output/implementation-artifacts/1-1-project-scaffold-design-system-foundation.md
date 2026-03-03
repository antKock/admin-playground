# Story 1.1: Project Scaffold & Design System Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the Angular project scaffolded with all dependencies, Tailwind design tokens, and tooling configured,
so that all subsequent development starts from a consistent, correctly-configured foundation.

## Acceptance Criteria

1. **Project Creation & Compilation** — Given no project exists yet, when the scaffold is created using `ng new admin-playground --style=css --routing --ssr=false --skip-tests=false`, then the project compiles and serves on `localhost:4200`

2. **Tailwind CSS Configuration** — Given the scaffold exists, when inspected, then Tailwind CSS v4 is configured via `.postcssrc.json` with `@tailwindcss/postcss` plugin

3. **Required Dependencies Installation** — Given the scaffold exists with dependencies installed, when inspected, then `@angular/cdk` and `lucide-angular` are installed

4. **Design Tokens Configuration** — Given the design system tokens are configured, when `styles.css` is inspected, then it imports Tailwind via `@import "tailwindcss"` and defines all 60+ design tokens using the `@theme` directive covering: brand, surface, status, text, icon, stroke categories

5. **TypeScript Strict Mode** — Given the project is configured, when TypeScript configuration is inspected, then TypeScript strict mode is enabled

6. **TypeScript Path Aliases** — Given the project is configured, when TSConfig is inspected, then path aliases map `@app/*` to `src/app/*`

7. **Linting & Formatting** — Given the scaffold exists, when ESLint and Prettier are configured, then they pass on the scaffold code

8. **Deployment Configuration** — Given the project is configured, when inspected, then `vercel.json` is created with SPA fallback rewrite

9. **Version Control Configuration** — Given the project is configured, when `.gitignore` is inspected, then it excludes `.env.local` and standard Angular ignores

10. **Environment Configuration** — Given the project is configured, when `environment.ts` is inspected, then it contains `apiBaseUrl` pointing to `https://laureatv2-api-staging.osc-fr1.scalingo.io` and a `production` flag

## Tasks / Subtasks

- [x] Task 1: Angular Project Scaffold (AC: #1)
  - [x] Run `ng new admin-playground --style=css --routing --ssr=false --skip-tests=false`
  - [x] Verify project compiles with `ng serve`
  - [x] Verify app loads on `http://localhost:4200`

- [x] Task 2: Install Post-Scaffold Dependencies (AC: #3)
  - [x] `npm install tailwindcss @tailwindcss/postcss postcss --save-dev`
  - [x] `npm install @angular/cdk`
  - [x] `npm install lucide-angular`
  - [x] Verify all dependencies resolve and project still compiles

- [x] Task 3: Configure Tailwind CSS v4 (AC: #2)
  - [x] Create `.postcssrc.json` with `{ "plugins": { "@tailwindcss/postcss": {} } }`
  - [x] Update `styles.css` to begin with `@import "tailwindcss";`
  - [x] Verify Tailwind utility classes work (add a test class, confirm it renders)

- [x] Task 4: Configure Design Tokens (AC: #4)
  - [x] Add `@theme` directive block to `styles.css` with all 60+ tokens
  - [x] Brand tokens: `--color-brand: #1400cc`, `--color-brand-hover: #0d009a`, `--color-brand-light: #d9c8f5`, `--color-brand-tertiary: #e84e0f`
  - [x] Surface tokens: `--color-surface-base: #ffffff`, `--color-surface-subtle: #f9f9f9`, `--color-surface-muted: #f4f4f4`, `--color-surface-light: #eeeeee`, `--color-surface-mid: #e4e4e4`, `--color-surface-active: #dde2f5`, `--color-surface-table-row-hover: #f0f2fa`
  - [x] Button surface tokens: `--color-surface-button-primary: #1400cc`, `--color-surface-button-hover: #0d009a`, `--color-surface-button-primary-disabled: #e8e8e8`
  - [x] Status tokens: `--color-status-draft: #ffffff`, `--color-status-review: #d9c8f5`, `--color-status-modify: #f5d87a`, `--color-status-checked: #a8d5ce`, `--color-status-invalid: #f5a0a0`, `--color-status-processing: #e89420`, `--color-status-done: #2e8b7a`, `--color-status-closed: #c8c8c8`
  - [x] Text tokens: `--color-text-primary: #1a1a1a`, `--color-text-secondary: #555555`, `--color-text-tertiary: #888888`, `--color-text-disabled: #b0b0b0`, `--color-text-link: #1400cc`, `--color-text-link-hover: #0d009a`, `--color-text-error: #b32020`, `--color-text-success: #2e8b7a`, `--color-text-warning: #8a6000`, `--color-text-outstanding: #e84e0f`
  - [x] Icon tokens: `--color-icon-primary: #1a1a1a`, `--color-icon-secondary: #555555`, `--color-icon-tertiary: #888888`, `--color-icon-disabled: #b0b0b0`, `--color-icon-active: #1400cc`, `--color-icon-error: #b32020`, `--color-icon-success: #2e8b7a`
  - [x] Stroke tokens: `--color-stroke-standard: #e0e0e0`, `--color-stroke-medium: #c8c8c8`, `--color-stroke-strong: #888888`
  - [x] Success/Error surface tokens: `--color-surface-success: #d4edda`, `--color-surface-error: #f5a0a0`
  - [x] Verify tokens render correctly with a test element

- [x] Task 5: TypeScript Configuration (AC: #5, #6)
  - [x] Verify `strict: true` in `tsconfig.json` (Angular CLI enables by default)
  - [x] Add path aliases to `tsconfig.json`: `"@app/*": ["src/app/*"]`
  - [x] Verify imports using `@app/` resolve correctly

- [x] Task 6: ESLint & Prettier Setup (AC: #7)
  - [x] Verify Angular CLI ESLint configuration is present (or add `@angular-eslint`)
  - [x] Create `.prettierrc` with project formatting rules
  - [x] Run `npx eslint .` — should pass with zero errors
  - [x] Run `npx prettier --check .` — should pass with zero issues

- [x] Task 7: Environment Configuration (AC: #10)
  - [x] Create/update `src/environments/environment.ts`:
    ```typescript
    export const environment = {
      production: false,
      apiBaseUrl: 'https://laureatv2-api-staging.osc-fr1.scalingo.io'
    };
    ```
  - [x] Create `src/environments/environment.prod.ts` (placeholder for future)

- [x] Task 8: Deployment & Version Control Configuration (AC: #8, #9)
  - [x] Create `vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
  - [x] Update `.gitignore` to include `.env.local`
  - [x] Verify `.gitignore` covers `node_modules/`, `dist/`, `.angular/`

- [x] Task 9: Verification & Cleanup
  - [x] Run `ng serve` — verify no errors, app loads
  - [x] Run `ng build` — verify production build succeeds
  - [x] Run `ng test` — verify default test passes
  - [x] Run ESLint and Prettier — confirm passing
  - [x] Remove any Angular default boilerplate content from `app.component.ts/html`

## Dev Notes

### Architecture Patterns & Constraints

- **Framework**: Angular 20 with standalone components exclusively (no NgModule)
- **CSS**: Tailwind CSS v4 via `@tailwindcss/postcss` — NO SCSS, plain CSS only
- **Design System**: Custom component library (NO Material, NO PrimeNG) — Tailwind + Angular CDK
- **Icons**: `lucide-angular` — all icons come from this library
- **TypeScript**: Strict mode mandatory, no `any` types
- **Component API**: Use `input()` / `output()` signal-based API (NOT `@Input` / `@Output` decorators)
- **State Management**: Angular signals only — no NgRx, no third-party state libraries
- **Build**: esbuild (Angular CLI default) — NOT Webpack
- **Styling approach**: Tailwind utility classes primary, custom CSS classes for component structure (e.g., `.data-table`, `.status-badge`)

### Critical Tailwind v4 Changes (Latest 2026)

- **PostCSS Plugin**: Use `@tailwindcss/postcss` (NOT `tailwindcss` directly as PostCSS plugin — that's the #1 v4 migration error)
- **CSS Import**: Use `@import "tailwindcss";` (replaces old `@tailwind base; @tailwind components; @tailwind utilities;`)
- **Theme Config**: Use `@theme` directive in CSS file (NO `tailwind.config.js` required in v4)
- **Custom Colors**: Define via `@theme { --color-*: value; }` in `styles.css`

### Angular 20 Key Points

- Standalone components are the **default** — `ng new` creates standalone-based apps automatically
- No `standalone: true` flag needed (it's the default)
- `bootstrapApplication()` in `main.ts` (not `platformBrowserDynamic().bootstrapModule()`)
- `provideRouter()`, `provideHttpClient()` in `app.config.ts`
- Signal-based inputs/outputs: `input()`, `output()`, `model()` from `@angular/core`

### File Naming Conventions

- Components: `kebab-case.component.ts` (e.g., `app-layout.component.ts`)
- Services: `kebab-case.service.ts` (e.g., `auth.service.ts`)
- Models: `kebab-case.model.ts`
- Routes: `kebab-case.routes.ts`
- Tests: `kebab-case.component.spec.ts` (co-located next to source)

### Component Selector Prefix

- All components use `app-` prefix: `app-data-table`, `app-status-badge`, etc.

### Import Ordering Convention

```typescript
// 1. Angular core
import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular CDK
import { CdkDragDrop } from '@angular/cdk/drag-drop';

// 3. Third-party
import { LucideAngularModule } from 'lucide-angular';

// 4. App core (@app/core/*)
import { BaseEntityService } from '@app/core/api/base-entity.service';

// 5. App shared (@app/shared/*)
import { DataTableComponent } from '@app/shared/components/data-table/data-table.component';

// 6. Feature-local (relative)
import { FundingProgramService } from './funding-program.service';
```

### Target Directory Structure (This Story Creates)

```
admin-playground/
├── .eslintrc.json (or eslint.config.js)
├── .gitignore
├── .postcssrc.json
├── .prettierrc
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── vercel.json
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.css              ← Tailwind import + @theme design tokens
│   ├── app/
│   │   ├── app.component.ts    ← Clean (no boilerplate)
│   │   ├── app.component.html  ← Minimal router-outlet
│   │   ├── app.routes.ts       ← Empty route array (populated in later stories)
│   │   └── app.config.ts       ← provideRouter, provideHttpClient
│   └── environments/
│       ├── environment.ts      ← apiBaseUrl + production flag
│       └── environment.prod.ts ← placeholder
└── (no src/app/core/, src/app/shared/, src/app/features/ yet — created in Stories 1.2-1.5)
```

### What This Story Does NOT Create

- No `core/` directory (Story 1.2-1.3)
- No `shared/` directory (Story 1.5)
- No `features/` directories (Epic 2+)
- No services, guards, interceptors (Story 1.2-1.3)
- No layout/navigation components (Story 1.4)
- No shared UI components (Story 1.5)

### Anti-Patterns to Avoid

- DO NOT create a `tailwind.config.js` — v4 uses `@theme` in CSS
- DO NOT use `tailwindcss` as the PostCSS plugin directly — use `@tailwindcss/postcss`
- DO NOT use NgModule anywhere
- DO NOT use `@Input()` / `@Output()` decorators — use `input()` / `output()` functions
- DO NOT add `any` types
- DO NOT use SCSS — plain CSS with Tailwind only
- DO NOT install Material, PrimeNG, or any pre-built UI library
- DO NOT create a `utils/` grab-bag folder
- DO NOT add `console.log` statements

### Project Structure Notes

- This story establishes the root project structure that all subsequent stories build upon
- The folder conventions defined here (kebab-case, co-located tests, flat feature folders) must be followed consistently across all 7 entity modules
- Design tokens defined in `styles.css` are the single source of truth for all component styling
- `environment.ts` pattern allows staging/production API URL switching

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — Acceptance criteria and BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template] — CLI command, dependencies, folder structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Design System] — Tailwind + CDK + Lucide decision
- [Source: _bmad-output/planning-artifacts/architecture.md#Code Structure] — Complete directory layout and naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#TypeScript Configuration] — Strict mode, path aliases
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation] — Tailwind + CDK rationale
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Color System] — Complete 60+ token palette
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Typography System] — Font stacks and type scale
- [Source: docs/color-palette.md] — Authoritative color values for all design tokens
- [Source: docs/BRIEF_CLAUDE_PROJET_ADMIN_LAUREAT.md] — Original project brief and technical stack decisions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- All 10 ACs verified as implemented. Angular 21.2 scaffold with Tailwind CSS v4, design tokens, TypeScript strict mode, path aliases, ESLint, Prettier, Vercel config, environment files.

### File List

- angular.json — Angular CLI workspace configuration
- package.json — Dependencies including Angular 21.2, Tailwind v4, CDK, Lucide
- tsconfig.json — Strict mode, @app/* path aliases
- tsconfig.app.json — Application TypeScript config
- tsconfig.spec.json — Test TypeScript config
- .postcssrc.json — Tailwind v4 PostCSS plugin
- .prettierrc — Prettier formatting rules
- eslint.config.js — ESLint with Angular rules
- vercel.json — SPA fallback rewrite
- .gitignore — Standard ignores plus .env.local
- .editorconfig — Editor configuration
- src/styles.css — Tailwind import + 79 design tokens via @theme
- src/main.ts — bootstrapApplication entry point
- src/environments/environment.ts — Staging API URL + production flag
- src/environments/environment.prod.ts — Production environment placeholder
- src/app/app.ts — Root component with Toast/ConfirmDialog
- src/app/app.config.ts — Application config with providers
- src/app/app.routes.ts — Route configuration
- src/app/app.spec.ts — Root component test
