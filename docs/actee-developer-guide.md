# ACTEE Developer Guide

Practical guide to the admin-playground architecture. Read this to add new features.

## Architecture Overview

Three layers, strict dependency direction: **Domain → Feature → Pages**.

```
src/app/
├── domains/          # Data layer — stores, APIs, models, forms
│   ├── agents/       # One folder per resource
│   │   ├── agent.store.ts       # Domain signalStore (state + mutations)
│   │   ├── agent.api.ts         # HTTP functions (no inject())
│   │   ├── agent.models.ts      # TypeScript types (re-exports from OpenAPI)
│   │   └── forms/
│   │       └── agent.form.ts    # createAgentForm() factory
│   ├── auth/         # Special: non-CRUD domain (signalStore with localStorage)
│   └── shared/                  # Cross-domain utilities
│       ├── with-cursor-pagination.ts
│       ├── store.utils.ts
│       └── api.utils.ts
├── features/         # Behavior layer — facades + UI components
│   └── agents/
│       ├── agent.store.ts       # Feature store (read-only ViewModel)
│       ├── agent.facade.ts      # Facade (orchestrates domain stores)
│       └── ui/
│           ├── agent-list.component.ts
│           ├── agent-detail.component.ts
│           └── agent-form.component.ts
├── pages/            # Route layer — composes features
│   └── agents/
│       ├── agents.page.ts       # <router-outlet /> wrapper
│       └── agents.routes.ts     # Route definitions
├── core/             # App-wide singletons (auth, layout, interceptors)
└── shared/           # Reusable UI components, directives, utils
```

**Rules:**
- Components only talk to their facade — never to stores or APIs directly
- Facades handle toast feedback, navigation, and error mapping
- Domain stores own all server state; feature stores only compute derived signals
- No Observables in components — all reactivity via signals

## Path Aliases

| Alias | Path |
|-------|------|
| `@app/` | `src/app/` |
| `@domains/` | `src/app/domains/` |
| `@features/` | `src/app/features/` |
| `@shared/` | `src/app/shared/` |
| `@core/` | `src/app/core/` |

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `agent-list.component.ts` |
| Domain store | `XxxDomainStore` | `AgentDomainStore` |
| Feature store | `XxxFeatureStore` | `AgentFeatureStore` |
| Facade | `XxxFacade` | `AgentFacade` |
| API functions | `xxxListLoader`, `loadXxx`, `createXxxRequest` | `agentListLoader` |
| Form factory | `createXxxForm()` | `createAgentForm()` |
| Models | `XxxRead`, `XxxCreate`, `XxxUpdate` | `AgentRead` |
| Components | `XxxListComponent`, `XxxDetailComponent`, `XxxFormComponent` | `AgentListComponent` |

**Note:** Some domain folders are singular (`building/`, `site/`, `auth/`) while features are always plural (`buildings/`, `sites/`). New domains should use plural. The `auth/` domain is a special case — it uses `signalStore` with `withHooks` for localStorage persistence, not the standard CRUD pattern.

## Create a New Domain

Using `agents` as the template:

### 1. Models (`src/app/domains/things/thing.models.ts`)

```typescript
import { components } from '@app/core/api/generated/api-types';

export type ThingRead = components['schemas']['ThingRead'];
export type ThingCreate = components['schemas']['ThingCreate'];
export type ThingUpdate = components['schemas']['ThingUpdate'];
```

### 2. API Service (`src/app/domains/things/thing.api.ts`)

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@app/../environments/environment';
import { PaginatedResponse } from '@app/core/api/paginated-response.model';
import { applyFilters } from '@domains/shared/api.utils';
import { FilterParams } from '@domains/shared/with-cursor-pagination';

const BASE_URL = `${environment.apiBaseUrl}/things/`;

export function thingListLoader(
  http: HttpClient,
  params: { cursor: string | null; limit: number; filters?: FilterParams },
): Observable<PaginatedResponse<ThingRead>> {
  let httpParams = new HttpParams();
  if (params.cursor) httpParams = httpParams.set('cursor', params.cursor);
  httpParams = httpParams.set('limit', params.limit.toString());
  httpParams = applyFilters(httpParams, params.filters);
  return http.get<PaginatedResponse<ThingRead>>(BASE_URL, { params: httpParams });
}

export function loadThing(http: HttpClient, id: string): Observable<ThingRead> {
  return http.get<ThingRead>(`${BASE_URL}${id}`);
}

// Mutation configs (consumed by httpMutation)
export function createThingRequest(data: ThingCreate) {
  return { url: BASE_URL, method: 'POST', body: data };
}

export function updateThingRequest(params: { id: string; data: ThingUpdate }) {
  return { url: `${BASE_URL}${params.id}`, method: 'PUT', body: params.data };
}

export function deleteThingRequest(id: string) {
  return { url: `${BASE_URL}${id}`, method: 'DELETE' };
}
```

### 3. Domain Store (`src/app/domains/things/thing.store.ts`)

```typescript
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, withProps, withFeature } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, EMPTY } from 'rxjs';
import { withMutations } from '@angular-architects/ngrx-toolkit';
import { httpMutation, concatOp } from '@angular-architects/ngrx-toolkit';
import { withCursorPagination } from '@domains/shared/with-cursor-pagination';
import { patch } from '@domains/shared/store.utils';

export const ThingDomainStore = signalStore(
  { providedIn: 'root' },
  withState({ selectedItem: null as ThingRead | null, isLoadingDetail: false, detailError: null as string | null }),
  withProps(() => ({ _http: inject(HttpClient) })),
  withFeature((store) => withCursorPagination<ThingRead>({
    loader: (params) => thingListLoader(store._http, params),
  })),
  withMutations(() => ({
    createMutation: httpMutation({ request: (data: ThingCreate) => createThingRequest(data), operator: concatOp }),
    updateMutation: httpMutation({ request: (p: { id: string; data: ThingUpdate }) => updateThingRequest(p), operator: concatOp }),
    deleteMutation: httpMutation({ request: (id: string) => deleteThingRequest(id), operator: concatOp }),
  })),
  withMethods((store) => ({
    selectById: rxMethod<string>(pipe(
      tap(() => patch(store, { isLoadingDetail: true })),
      switchMap((id) => loadThing(store._http, id).pipe(
        tap((item) => patch(store, { selectedItem: item, isLoadingDetail: false, detailError: null })),
        catchError((err) => { patch(store, { detailError: err?.message ?? 'Load failed', isLoadingDetail: false, selectedItem: null }); return EMPTY; }),
      )),
    )),
    clearSelection(): void { patch(store, { selectedItem: null }); },
  })),
);
```

**Composition order matters:** `withState → withProps → withFeature(pagination) → withMutations → withMethods`

**Optional: use-cases/ subfolder** — For complex pure logic (e.g., ~40-line data transformations), extract to a dedicated use-case file: `src/app/features/xxx/use-cases/build-yyy.ts`. The facade then calls the pure function inside a `computed()`. See `src/app/features/action-models/use-cases/build-indicator-cards.ts` for a real example.

### 4. Form Factory (`src/app/domains/things/forms/thing.form.ts`)

```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export function createThingForm(fb: FormBuilder): FormGroup {
  return fb.group({
    name: [null as string | null, Validators.required],
    description: [null as string | null],
  });
}
```

## Create a New Feature

### 1. Feature Store (`src/app/features/things/thing.store.ts`)

Read-only ViewModel — only `withComputed`, no mutations:

```typescript
import { computed, inject } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';
import { ThingDomainStore } from '@domains/things/thing.store';

export const ThingFeatureStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const ds = inject(ThingDomainStore);
    return {
      items: computed(() => ds.items() as ThingRead[]),
      selectedItem: computed(() => ds.selectedItem()),
      isLoading: computed(() => ds.isLoading()),
      isLoadingDetail: computed(() => ds.isLoadingDetail()),
      hasMore: computed(() => ds.hasMore()),
      error: computed(() => ds.error()),
      detailError: computed(() => ds.detailError()),
      isEmpty: computed(() => ds.isEmpty()),
      totalCount: computed(() => ds.totalCount()),
      createIsPending: computed(() => ds.createMutationIsPending()),
      updateIsPending: computed(() => ds.updateMutationIsPending()),
      deleteIsPending: computed(() => ds.deleteMutationIsPending()),
    };
  }),
);
```

### 2. Facade (`src/app/features/things/thing.facade.ts`)

Orchestrates store calls, handles toast + navigation:

```typescript
@Injectable({ providedIn: 'root' })
export class ThingFacade {
  private readonly domainStore = inject(ThingDomainStore);
  private readonly featureStore = inject(ThingFeatureStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // Readonly signals from feature store
  readonly items = this.featureStore.items;
  readonly selectedItem = this.featureStore.selectedItem;
  // ... all other signals ...

  // Intention methods
  load(filters?: FilterParams): void { this.domainStore.load(filters); }
  loadMore(): void { this.domainStore.loadMore(); }
  select(id: string): void { this.domainStore.selectById(id); }
  clearSelection(): void { this.domainStore.clearSelection(); }

  async create(data: ThingCreate): Promise<void> {
    const result = await this.domainStore.createMutation(data);
    if (result.status === 'success') {
      this.toast.success('Élément créé');
      this.router.navigate(['/things']);
    } else if (result.status === 'error') {
      handleMutationError(this.toast, result.error);
    }
  }
  // update(), delete() follow the same pattern
}
```

### 3. List Component

Key patterns:
- `hasLoaded` signal guard on empty state (prevents "no results" flash on initial load)
- `DataTableComponent` for table rendering with sort/filter
- `ListPageLayoutComponent` for page shell
- `effect()` sets `hasLoaded` when loading finishes

```typescript
@Component({
  imports: [DataTableComponent, ListPageLayoutComponent],
  templateUrl: './thing-list.component.html',
})
export class ThingListComponent implements OnInit {
  readonly facade = inject(ThingFacade);
  readonly hasLoaded = signal(false);

  constructor() {
    effect(() => { if (!this.facade.isLoading()) this.hasLoaded.set(true); });
  }

  ngOnInit(): void { this.facade.load(); }
  onLoadMore(): void { this.facade.loadMore(); }
}
```

### 4. Detail Component

Key patterns:
- `MetadataGridComponent` for field display
- `ngOnDestroy` calls `facade.clearSelection()` (prevents stale data flash)
- `DetailPageLayoutComponent` for page shell with breadcrumbs

```typescript
@Component({
  imports: [MetadataGridComponent, DetailPageLayoutComponent],
  templateUrl: './thing-detail.component.html',
})
export class ThingDetailComponent implements OnInit, OnDestroy {
  readonly facade = inject(ThingFacade);
  readonly fields = computed<MetadataField[]>(() => { /* ... */ });

  ngOnInit(): void { this.facade.select(this.route.snapshot.paramMap.get('id')!); }
  ngOnDestroy(): void { this.facade.clearSelection(); }
}
```

`MetadataField` types: `'text'`, `'mono'`, `'linked'` (with `linkedRoute`), `'date'` (auto-formatted fr-FR), `'status'`.

### 5. Form Component

Key patterns:
- `FormPageLayoutComponent` with Cmd+S / Escape keyboard shortcuts
- `FormFieldComponent` for label + validation display
- `HasUnsavedChanges` interface for `unsavedChangesGuard`
- `effect()` patches form when `selectedItem` loads in edit mode

```typescript
@Component({
  imports: [ReactiveFormsModule, FormFieldComponent, FormPageLayoutComponent],
  templateUrl: './thing-form.component.html',
})
export class ThingFormComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  readonly facade = inject(ThingFacade);
  readonly form = createThingForm(inject(FormBuilder));

  ngOnDestroy(): void { this.facade.clearSelection(); }
  hasUnsavedChanges(): boolean { return this.form.dirty && !this.submitting(); }
}
```

### 6. Page + Routes (`src/app/pages/things/`)

```typescript
// things.page.ts
@Component({ template: `<router-outlet />`, imports: [RouterOutlet] })
export class ThingsPage {}

// things.routes.ts
export const thingsRoutes: Routes = [
  { path: '', component: ThingsPage, children: [
    { path: '', component: ThingListComponent },
    { path: 'new', component: ThingFormComponent, canDeactivate: [unsavedChangesGuard] },
    { path: ':id', component: ThingDetailComponent },
    { path: ':id/edit', component: ThingFormComponent, canDeactivate: [unsavedChangesGuard] },
  ]},
];
```

Register in `app.routes.ts`:
```typescript
{ path: 'things', loadChildren: () => import('./pages/things/things.routes').then(m => m.thingsRoutes), canActivate: [adminGuard] },
```

## Pattern Reference

### Mutations

| Pattern | Operator | Use Case |
|---------|----------|----------|
| `httpMutation` + `concatOp` | Queues sequentially | CRUD operations (order matters) |
| `httpMutation` + `exhaustOp` | Ignores while in-flight | Status transitions (prevents double-click) |

Facade handles result: `result.status === 'success'` → toast + navigate. `result.status === 'error'` → `handleMutationError()`.

### Date Formatting

Always use `formatDateFr()` from `@app/shared/utils/format-date`:
```typescript
import { formatDateFr } from '@app/shared/utils/format-date';
```

In `MetadataGrid`, use `type: 'date'` — it auto-formats. In `DataTable`, columns with `type: 'date'` also auto-format.

### Shared Components

| Component | Purpose | Used In |
|-----------|---------|---------|
| `DataTableComponent` | Sortable/filterable table with infinite scroll | List components |
| `MetadataGridComponent` | Key-value field display | Detail components |
| `FormFieldComponent` | Label + validation wrapper | Form components |
| `SaveBarComponent` | Save/discard bar | Form components (via FormPageLayout) |
| `ListPageLayoutComponent` | Page shell: title, create button, empty state | List components |
| `DetailPageLayoutComponent` | Page shell: breadcrumbs, skeleton loading | Detail components |
| `FormPageLayoutComponent` | Page shell: breadcrumbs, Cmd+S, SaveBar | Form components |
| `BreadcrumbComponent` | Navigation breadcrumbs | Detail + form (via layouts) |
| `ConfirmDialogService` | Async confirmation modal | Delete/status change actions |
| `ToastService` | Success/error notifications | Facades |
