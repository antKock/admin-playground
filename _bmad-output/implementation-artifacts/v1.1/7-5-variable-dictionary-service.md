# Story 7.5: Variable Dictionary Service

Status: ready-for-dev
Depends-on: none (can run in parallel with 7.1 and 7.3)

## Story

As a developer,
I want a service that assembles the list of available variables for a given model,
so that the autocomplete and validation can reference the correct variable names and types.

## Acceptance Criteria

1. **Given** an action model being edited **When** the variable dictionary is requested **Then** it returns a `ProseVariable[]` containing:
   - All indicators (by `technical_label`) as root-level variables (no prefix)
   - Root entity properties from the action API response schema (prefixed with `action.`)
   - For each associated entity type (community, building, user, etc.): entity properties prefixed with `entity.` (e.g., `community.siret`) and all indicators prefixed with `entity.` (e.g., `community.montant`)
2. **Given** a folder model being edited **When** the variable dictionary is requested **Then** the same logic applies with `folder` as the root entity prefix
3. **Data model:**
```typescript
export interface ProseVariable {
  path: string;           // 'montant' or 'community.siret'
  type: 'nombre' | 'texte' | 'liste' | 'booleen' | 'date';
  group: string;          // '' (root) | 'action' | 'community' | 'building'
  source: 'indicator' | 'property';
}
```
4. **Given** multiple rule fields on the same indicator card **When** each requests the variable dictionary **Then** the dictionary is computed once and shared (not re-fetched per field)
5. Entity resolution:
   - Hardcoded: `Action_model` → `action`, `Folder_model` → `folder`
   - API-driven step 1: fetch root entity (action/folder) instance → discover associated entity types from response structure
   - API-driven step 2: for each association type → fetch entity instance → extract property names and types
6. Variable types: map from `IndicatorModelType` enum (from API types) — NOT from runtime value inspection:
   - `'text'` → `'texte'`, `'number'` → `'nombre'`, `'boolean'` → `'booleen'`, `'list'` / `'select'` → `'liste'`, `'date'` → `'date'`
   - For entity properties (no indicator type available): infer from response value type — `string` → `'texte'`, `number` → `'nombre'`, `boolean` → `'booleen'`, `Array` → `'liste'`
7. **"All indicators"** means the **global indicator list** (all indicator models in the system), not just those attached to the current model. Any indicator can be referenced in a rule.

## Tasks / Subtasks

- [ ] Task 1: Create ProseVariable interface and service skeleton (AC: #3)
  - [ ] Create `src/app/shared/services/variable-dictionary.service.ts`
  - [ ] Define and export `ProseVariable` interface
  - [ ] Create `VariableDictionaryService` as `@Injectable({ providedIn: 'root' })`
  - [ ] Inject `HttpClient`
  - [ ] Method: `getVariables(modelType: 'action' | 'folder', modelId: string): Signal<ProseVariable[]>`
  - [ ] Use `toSignal()` from `@angular/core/rxjs-interop` to convert async Observable to Signal, with initial value `[]`
- [ ] Task 2: Create `IndicatorModelType` → `ProseVariable.type` mapping (AC: #6)
  - [ ] Create explicit mapping function:
    ```typescript
    function mapIndicatorType(apiType: string): ProseVariable['type'] {
      const map: Record<string, ProseVariable['type']> = {
        text: 'texte', number: 'nombre', boolean: 'booleen',
        list: 'liste', select: 'liste', date: 'date',
      };
      return map[apiType] ?? 'texte'; // fallback to texte
    }
    ```
  - [ ] Check the actual `IndicatorModelType` enum values in `src/app/core/api/generated/api-types.ts` to ensure the mapping covers all values
- [ ] Task 3: Assemble indicator variables (AC: #1, #2, #7)
  - [ ] Fetch all indicators using the existing indicator model API pattern (see `src/app/domains/indicator-models/indicator-model.api.ts`)
  - [ ] Map each indicator to `{ path: indicator.technical_label, type: mapIndicatorType(indicator.type), group: '', source: 'indicator' }`
  - [ ] For each associated entity: create prefixed entries `{ path: 'entity.technical_label', type: ..., group: entityName, source: 'indicator' }`
- [ ] Task 4: Assemble entity property variables (AC: #1, #2, #5)
  - [ ] Hardcode model type → root entity mapping: `Action_model` → `'action'`, `Folder_model` → `'folder'`
  - [ ] Fetch a sample root entity instance from API → inspect response keys → infer types from values using `inferPropertyType()`
  - [ ] For each property: `{ path: 'action.propertyName', type: inferred, group: 'action', source: 'property' }`
  - [ ] Discover associated entity types from response structure (look for nested object/array keys) → fetch each → extract properties with entity prefix
  - [ ] **Note:** If no existing API endpoint returns a raw action/folder entity instance, you may need to create a new API function in the appropriate domain API file. Check `src/app/domains/action-models/action-model.api.ts` and `src/app/domains/folder-models/folder-model.api.ts` first.
- [ ] Task 5: Property type inference utility (AC: #6)
  - [ ] `inferPropertyType(value: unknown): ProseVariable['type']`
  - [ ] `typeof value === 'string'` → `'texte'`, `typeof value === 'number'` → `'nombre'`, `typeof value === 'boolean'` → `'booleen'`, `Array.isArray(value)` → `'liste'`, date-like string (ISO format) → `'date'`
  - [ ] This is ONLY for entity properties where no indicator type is available. Indicators use `mapIndicatorType()` (Task 2).
- [ ] Task 6: Implement caching (AC: #4)
  - [ ] Cache dictionary per `${modelType}:${modelId}` key using a `Map<string, Signal<ProseVariable[]>>`
  - [ ] Multiple `getVariables()` calls with the same key return the same signal instance
  - [ ] Cache invalidation: not needed for v1.1 (dictionary is stable during a session)
- [ ] Task 7: Error handling
  - [ ] If API calls fail → return empty array signal (graceful degradation)
  - [ ] Log error to console for debugging
  - [ ] Do NOT show toast or error UI — the dictionary is a background service
- [ ] Task 8: Write tests (AC: all)
  - [ ] Create `src/app/shared/services/variable-dictionary.service.spec.ts`
  - [ ] Test `mapIndicatorType()` for all enum values
  - [ ] Test `inferPropertyType()` for all value types
  - [ ] Test indicator variables assembled correctly (no prefix for root)
  - [ ] Test entity properties prefixed correctly
  - [ ] Test caching: same `modelType:modelId` returns same signal
  - [ ] Test API error → empty array
  - [ ] Run tests: `npx ng test --no-watch`

## Dev Notes

### Architecture & Patterns

- **New file:** `src/app/shared/services/variable-dictionary.service.ts`
- **Test file:** `src/app/shared/services/variable-dictionary.service.spec.ts`
- **ACTEE pattern compliance:** This service sits at the `shared` level since it's consumed by `RuleFieldComponent` (shared component). It does NOT follow the full domain→feature→facade pattern because it's a cross-cutting utility, not a domain entity.
- Uses `HttpClient` injection (like the ACTEE API layer) rather than importing domain stores directly.
- Uses `toSignal()` from `@angular/core/rxjs-interop` for the async-to-signal bridge.

### Async Pattern

```typescript
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

// In service:
getVariables(modelType: 'action' | 'folder', modelId: string): Signal<ProseVariable[]> {
  const cacheKey = `${modelType}:${modelId}`;
  if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

  const variables$ = this.assembleVariables(modelType, modelId).pipe(
    catchError(() => of([])),
    shareReplay(1),
  );
  const sig = toSignal(variables$, { initialValue: [] });
  this.cache.set(cacheKey, sig);
  return sig;
}
```

### Existing Code to Reference

- `src/app/domains/indicator-models/indicator-model.api.ts` — API pattern for fetching indicators
- `src/app/domains/indicator-models/indicator-model.models.ts` — indicator model types (includes `technical_label`, `type`)
- `src/app/core/api/generated/api-types.ts` — `IndicatorModelType` enum, `IndicatorModelRead` type
- `src/app/shared/components/indicator-card/indicator-card.component.ts` — consumer (4 rule fields per card)
- `src/app/shared/components/indicator-picker/indicator-picker.component.ts` — already lists indicators by `technical_label`

### What NOT to Do

- Do not create a domain store for variables — this is a shared utility service
- Do not hardcode variable lists — they must come from the API
- Do not use `inferPropertyType()` for indicators — indicators have explicit types from `IndicatorModelType`
- Do not conflate the two type-mapping approaches (enum mapping vs runtime inference)

### Project Structure Notes

- New: `src/app/shared/services/variable-dictionary.service.ts`
- New: `src/app/shared/services/variable-dictionary.service.spec.ts`
- Check: `src/app/core/api/generated/api-types.ts` for `IndicatorModelType` enum values
- Check: `src/app/domains/action-models/` and `src/app/domains/folder-models/` for existing API functions
- Run tests: `npx ng test --no-watch`

### References

- [Source: _bmad-output/planning-artifacts/v1.1/epics.md#Story 7.5]
- [Source: _bmad-output/planning-artifacts/v1.1/prose-editor-implementation-brief.md#Section 5]
- [Source: src/app/domains/indicator-models/indicator-model.api.ts — API pattern]
- [Source: src/app/core/api/generated/api-types.ts — IndicatorModelType, IndicatorModelRead]
- [Source: src/app/shared/components/indicator-card/indicator-card.component.ts — consumer]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
