# Story 16.5: Create FormFieldComponent & Migrate Forms

Status: ready-for-dev

## Story

As a developer,
I want a shared form field wrapper handling label, validation display, and error styling,
so that I don't duplicate `showError()` + `[class.border-error]` in every form.

## Acceptance Criteria

1. A reusable `FormFieldComponent` exists at `src/app/shared/components/form-field/` with label, control input, error message display, and auto border-error styling
2. All 11 form components (agent-form, action-theme-form, indicator-model-form, community-form, funding-program-form, user-form, folder-model-form, building-form, site-form, action-model-form) plus login are migrated to use `FormFieldComponent` and their local `showError()` methods are removed
3. No remaining `showError()` method duplication in any form component

## Tasks / Subtasks

- [ ] Task 1: Create FormFieldComponent in `shared/components/form-field/` (AC: #1)
  - [ ] 1.1 Create `src/app/shared/components/form-field/form-field.component.ts`:
    - Standalone component, `changeDetection: OnPush`
    - Inputs: `label: string`, `control: AbstractControl`, `errorMessage: string` (optional, defaults to 'Ce champ est requis')
    - Template: `<label>`, `<ng-content>` for the input element, conditional error `<span>`
    - Logic: use a getter or template expression `get showError(): boolean { return this.control?.invalid && (this.control.dirty || this.control.touched); }` — **do NOT use `computed()` since `AbstractControl` is not a signal**
    - Auto-apply `border-error` class to projected content via host class or wrapper div
  - [ ] 1.2 Create `src/app/shared/components/form-field/form-field.component.html` (externalized template)
  - [ ] 1.3 Create `src/app/shared/components/form-field/form-field.component.css` (externalized styles)
  - [ ] 1.4 Create `src/app/shared/components/form-field/form-field.component.spec.ts`:
    - Test: renders label text
    - Test: shows error when control is invalid + dirty
    - Test: hides error when control is valid
    - Test: hides error when control is pristine + untouched
    - Test: applies border-error class when showing error
    - Test: projects content via ng-content

- [ ] Task 2: Migrate agent-form and action-theme-form (AC: #2)
  - [ ] 2.1 Update `src/app/features/agents/ui/agent-form.component.ts` — import FormFieldComponent, wrap form fields, remove `showError()`
  - [ ] 2.2 Update `src/app/features/action-themes/ui/action-theme-form.component.ts` — same migration
  - [ ] 2.3 Update corresponding spec files

- [ ] Task 3: Migrate indicator-model-form and community-form (AC: #2)
  - [ ] 3.1 Update `src/app/features/indicator-models/ui/indicator-model-form.component.ts`
  - [ ] 3.2 Update `src/app/features/communities/ui/community-form.component.ts`
  - [ ] 3.3 Update corresponding spec files

- [ ] Task 4: Migrate funding-program-form and user-form (AC: #2)
  - [ ] 4.1 Update `src/app/features/funding-programs/ui/funding-program-form.component.ts`
  - [ ] 4.2 Update `src/app/features/users/ui/user-form.component.ts`
  - [ ] 4.3 Update corresponding spec files

- [ ] Task 5: Migrate folder-model-form, building-form, site-form (AC: #2)
  - [ ] 5.1 Update `src/app/features/folder-models/ui/folder-model-form.component.ts`
  - [ ] 5.2 Update `src/app/features/buildings/ui/building-form.component.ts`
  - [ ] 5.3 Update `src/app/features/sites/ui/site-form.component.ts`
  - [ ] 5.4 Update corresponding spec files

- [ ] Task 6: Migrate action-model-form (AC: #2)
  - [ ] 6.1 Update `src/app/features/action-models/ui/action-model-form.component.ts`
  - [ ] 6.2 Update corresponding spec file

- [ ] Task 7: Migrate login component (AC: #2)
  - [ ] 7.1 Update `src/app/core/auth/login.component.ts` — simpler form but same pattern
  - [ ] 7.2 Update `src/app/core/auth/login.component.spec.ts`

- [ ] Task 8: Verify all `showError()` methods are removed (AC: #3)
  - [ ] 8.1 Search codebase for `showError` — should only appear in FormFieldComponent and tests
  - [ ] 8.2 Search for `border-error` class usage in form templates — should be handled by FormFieldComponent

- [ ] Task 9: Run `npx ng build` and `npx ng test --no-watch` (AC: #1, #2, #3)

## Dev Notes

- The duplicated `showError()` pattern appears identically in all 10 form components:
  ```typescript
  showError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
  ```
- **FormFieldComponent design**: Use content projection (`<ng-content>`) so the actual input element stays in the parent template. The wrapper adds label + error display + conditional styling.
- **Template migration pattern**: Replace:
  ```html
  <label for="name">Nom</label>
  <input id="name" formControlName="name" [class.border-error]="showError('name')">
  <span class="error" *ngIf="showError('name')">Ce champ est requis</span>
  ```
  With:
  ```html
  <app-form-field label="Nom" [control]="form.controls.name">
    <input id="name" formControlName="name">
  </app-form-field>
  ```
- **Edge case**: Some forms have custom error messages per field. The `errorMessage` input should support this. Consider also supporting multiple validation messages (required vs pattern vs minlength).
- **AbstractControl note**: The component accepts `AbstractControl` (not `FormControl`) to support both `FormControl` and `FormGroup` fields.
- Forms with `showError`: action-model-form, action-theme-form, agent-form, building-form, community-form, folder-model-form, funding-program-form, indicator-model-form, site-form, user-form (10 forms) + login (11 total components to migrate)
- **IMPORTANT**: `AbstractControl` is NOT a signal — do not use `computed()` for `showError`. Use a getter or template expression instead. `OnPush` change detection works because reactive forms trigger change detection on control state changes.
- **Dependency**: Story 16.4 (AuthStore migration) should be completed before this story, as both modify `login.component.ts`. Migrating login to `FormFieldComponent` after the AuthStore change avoids merge conflicts.

### Project Structure Notes

- **Create**: `src/app/shared/components/form-field/form-field.component.ts`
- **Create**: `src/app/shared/components/form-field/form-field.component.html`
- **Create**: `src/app/shared/components/form-field/form-field.component.css`
- **Create**: `src/app/shared/components/form-field/form-field.component.spec.ts`
- **Modify**: All 10 form components listed above + login component (11 total)
- **Modify**: All corresponding spec files

### References

- [Source: docs/architecture-ACTEE.md]
- [Source: _bmad-output/planning-artifacts/v2/epics.md#Story 16.5]
- [Source: _bmad-output/implementation-artifacts/v2/v2-technical-analysis.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
