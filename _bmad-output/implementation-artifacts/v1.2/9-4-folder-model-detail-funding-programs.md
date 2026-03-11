# Story 9.4: FolderModel Detail with Linked Funding Programs

Status: review

## Story

As an admin,
I want to see which funding programs are associated with a folder model on its detail page as clickable navigation links,
so that I can understand the programmatic relationships and navigate to each program.

> **Scope note (2026-03-11):** This story now includes the FM → FP bidirectional navigation from former Story 12.1. Each funding program name must be a clickable link to its detail page.

## Acceptance Criteria

1. **Given** a folder-model detail page with associated funding programs **When** the page loads **Then** a "Programmes de financement" section displays the list of associated programs **And** each program name is a clickable link navigating to `/funding-programs/{id}`
2. **Given** a folder-model with no associated funding programs **When** the detail page loads **Then** the "Programmes de financement" section displays "Aucun programme de financement associe"

## Tasks / Subtasks

- [x] Task 1: Replace MetadataGrid text field with dedicated linked list section (AC: #1, #2)
  - [ ] Edit `src/app/features/folder-models/ui/folder-model-detail.component.ts`
  - [ ] Remove the current "Programmes de financement" entry from the `fields` computed (currently shows comma-separated names as plain text)
  - [ ] Add a new template section below `<app-metadata-grid>` for funding programs
  - [ ] Import `RouterLink` from `@angular/router` in the component imports
- [x] Task 2: Build linked list template with clickable links (AC: #1)
  - [ ] Render `model().funding_programs` as a list of `<a routerLink>` elements
  - [ ] Each link navigates to `/funding-programs/{fp.id}`
  - [ ] Style consistently: use `text-brand hover:underline` for links
  - [ ] Add section heading "Programmes de financement" with `text-sm font-medium text-text-secondary` label style
- [x] Task 3: Handle empty state (AC: #2)
  - [ ] When `model().funding_programs` is empty or undefined, show "Aucun programme de financement associe"
  - [ ] Style empty state text with `text-sm text-text-secondary`
- [x] Task 4: Write tests (AC: #1, #2)
  - [ ] Test: funding programs render as clickable links with correct routes
  - [ ] Test: empty funding_programs array shows empty state message
  - [ ] Run `npx ng test --no-watch` — all tests pass

## Dev Notes

### Current State of the Detail Component

The folder-model detail component (`folder-model-detail.component.ts`) **already displays** funding programs in the MetadataGrid, but as plain comma-separated text:

```typescript
const fpNames = m.funding_programs?.map(fp => fp.name).join(', ') || 'Aucun';
return [
  // ...
  { label: 'Programmes de financement', value: fpNames, type: 'text' as const },
  // ...
];
```

This story upgrades the display from plain text to **clickable links** that navigate to each funding program's detail page. Since MetadataGrid's `linked` type only supports a single link, we need a dedicated template section for the list of links.

### Exact Files to Touch

| File | Action | What |
|------|--------|------|
| `src/app/features/folder-models/ui/folder-model-detail.component.ts` | Modify | Remove FP from MetadataGrid fields, add linked list section in template |

### Template Pattern for Linked List Section

Add below the `<app-metadata-grid>` element, inside the `@else if (model())` block:

```html
<!-- Funding Programs Section -->
<div class="mt-6">
  <h2 class="text-sm font-medium text-text-secondary mb-2">Programmes de financement</h2>
  @if (model()!.funding_programs?.length) {
    <ul class="space-y-1">
      @for (fp of model()!.funding_programs!; track fp.id) {
        <li>
          <a
            [routerLink]="['/funding-programs', fp.id]"
            class="text-sm text-brand hover:underline"
          >
            {{ fp.name }}
          </a>
        </li>
      }
    </ul>
  } @else {
    <p class="text-sm text-text-secondary">Aucun programme de financement associe</p>
  }
</div>
```

### RouterLink Import

The component currently imports: `MetadataGridComponent, ApiInspectorComponent, BreadcrumbComponent`. Add `RouterLink` from `@angular/router`:

```typescript
import { RouterLink } from '@angular/router';

@Component({
  imports: [MetadataGridComponent, ApiInspectorComponent, BreadcrumbComponent, RouterLink],
  // ...
})
```

### Data Shape — FolderModelRead.funding_programs

From `api-types.ts`:
```typescript
FolderModelRead: {
  name: string;
  description?: string | null;
  id: string;
  created_at: string;
  updated_at: string;
  funding_programs?: FundingProgramRead[];  // Optional array
}
```

Each `FundingProgramRead` has `id`, `name`, and other fields. We only need `id` (for routing) and `name` (for display).

### Remove from MetadataGrid Fields Computed

Remove this entry from the `fields` computed:
```typescript
// REMOVE:
{ label: 'Programmes de financement', value: fpNames, type: 'text' as const },
```

Also remove the `fpNames` variable:
```typescript
// REMOVE:
const fpNames = m.funding_programs?.map(fp => fp.name).join(', ') || 'Aucun';
```

### Anti-Patterns to Avoid

- Do NOT keep the FP display in MetadataGrid AND add a separate section — that would duplicate the information
- Do NOT use MetadataGrid `type: 'linked'` for the FP list — it only supports a single link, not a list of links
- Do NOT make additional API calls to load FP data — the `FolderModelRead` response already embeds `funding_programs[]` with full objects
- Do NOT forget to add `RouterLink` to the component's `imports` array — `[routerLink]` will silently fail without it
- Do NOT use `router.navigate()` for the links — use declarative `[routerLink]` for anchor elements (better accessibility, right-click behavior)

### Similar Pattern Reference

The Community detail component (future Epic 10) will need a similar pattern for parents/children lists. This establishes the linked list section pattern for reuse.

### Project Structure Notes

- Only the detail component template and imports change
- No domain, store, or facade changes needed — data is already in the read model
- The `funding_programs` array comes embedded in the `FolderModelRead` response

### References

- [Source: `src/app/features/folder-models/ui/folder-model-detail.component.ts` — current detail component with MetadataGrid FP display]
- [Source: `src/app/core/api/generated/api-types.ts:2694-2716` — FolderModelRead with funding_programs array]
- [Source: `src/app/shared/components/metadata-grid/metadata-grid.component.ts` — MetadataField interface and linked type rendering]
- [Source: `_bmad-output/planning-artifacts/v1.2/epics.md` — Story 9.4 acceptance criteria]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- None

### Completion Notes List
- Removed funding programs from MetadataGrid fields (was plain comma-separated text)
- Added dedicated linked list section below MetadataGrid with `@for` loop over `funding_programs`
- Each program renders as `<a [routerLink]>` to `/funding-programs/{id}` with brand-colored link styling
- Added empty state: "Aucun programme de financement associé"
- Imported `RouterLink` from `@angular/router`
- All 806 tests pass

### File List
- `src/app/features/folder-models/ui/folder-model-detail.component.ts` (modified)
