# Story 16.5: Create FormFieldComponent & Migrate Forms

Status: done

## Story

As a developer,
I want a shared form field wrapper handling label, validation display, and error styling,
so that I don't duplicate `showError()` + `[class.border-error]` in every form.

## Acceptance Criteria

1. A reusable `FormFieldComponent` exists at `src/app/shared/components/form-field/` with label, control input, error message display, and auto border-error styling
2. All 10 form components plus login are migrated to use `FormFieldComponent` and their local `showError()` methods are removed
3. No remaining `showError()` method duplication in any form component

## Tasks / Subtasks

- [x] All tasks completed (see completion notes)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

- Created `FormFieldComponent` with content projection, label, control input, error message display
- Uses getter `showError` (not computed) since AbstractControl is not a signal
- Default change detection (not OnPush) because form control state changes need to trigger re-evaluation
- Template uses `border-error-wrapper` class with `:deep()` selectors for projected inputs
- Created 8 unit tests for the component
- Migrated all 10 form components: removed `showError()` method, added `FormFieldComponent` import
- Migrated all 10 form templates: replaced label+input+showError pattern with `<app-form-field>` wrapper
- Used `form.get('fieldName')!` instead of `form.controls.fieldName` (untyped FormGroups)
- Login component skipped (doesn't use `showError` pattern)
- 25 template bindings replaced across all forms
- All 85 test files (998 tests) pass with zero regressions

### File List

- `src/app/shared/components/form-field/form-field.component.ts` (new)
- `src/app/shared/components/form-field/form-field.component.html` (new)
- `src/app/shared/components/form-field/form-field.component.css` (new)
- `src/app/shared/components/form-field/form-field.component.spec.ts` (new)
- `src/app/features/agents/ui/agent-form.component.ts` (modified)
- `src/app/features/agents/ui/agent-form.component.html` (modified)
- `src/app/features/action-themes/ui/action-theme-form.component.ts` (modified)
- `src/app/features/action-themes/ui/action-theme-form.component.html` (modified)
- `src/app/features/indicator-models/ui/indicator-model-form.component.ts` (modified)
- `src/app/features/indicator-models/ui/indicator-model-form.component.html` (modified)
- `src/app/features/communities/ui/community-form.component.ts` (modified)
- `src/app/features/communities/ui/community-form.component.html` (modified)
- `src/app/features/funding-programs/ui/funding-program-form.component.ts` (modified)
- `src/app/features/funding-programs/ui/funding-program-form.component.html` (modified)
- `src/app/features/users/ui/user-form.component.ts` (modified)
- `src/app/features/users/ui/user-form.component.html` (modified)
- `src/app/features/folder-models/ui/folder-model-form.component.ts` (modified)
- `src/app/features/folder-models/ui/folder-model-form.component.html` (modified)
- `src/app/features/buildings/ui/building-form.component.ts` (modified)
- `src/app/features/buildings/ui/building-form.component.html` (modified)
- `src/app/features/sites/ui/site-form.component.ts` (modified)
- `src/app/features/sites/ui/site-form.component.html` (modified)
- `src/app/features/action-models/ui/action-model-form.component.ts` (modified)
- `src/app/features/action-models/ui/action-model-form.component.html` (modified)
