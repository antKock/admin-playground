# Comparison Report: Architecture ACTEE vs. admin-playground

_Date: 2026-03-04_
_Project: admin-playground_
_Author: Architecture Facilitator_

---

## Executive Summary

The **architecture-ACTEE** guidelines define a layered architecture (Domain → Feature → UI) centered on **NgRx Signal Stores**, **facades**, **use-cases**, and strict separation between business logic, orchestration, and UI. The **admin-playground** project uses a **simplified flat architecture** with **BaseEntityService + Angular Signals**, smart page components injecting services directly, and no separate domain/facade/use-case layers.

**Overall assessment:** The gap is **significant but manageable**. The current codebase is small (~41 TypeScript files, 7 feature modules) and follows consistent patterns, making migration feasible. However, this is a structural refactoring — not a quick tweak — and introduces new dependencies (@ngrx/signals, ngrx-toolkit).

---

## Gap Analysis

### 1. Folder Structure

| Aspect | ACTEE Requires | admin-playground Has | Gap |
|--------|---------------|---------------------|-----|
| `domains/` folder | Yes — source of truth layer | No — doesn't exist | **Full creation needed** |
| `features/` folder | Yes — with store + facade + ui/ subfolder | Yes — but flat (service + components together) | **Restructure needed** |
| `pages/` folder | Yes — route = layout only | No — components serve as smart containers | **New layer needed** |
| `use-cases/` folder | Yes — in both domains/ and features/ | No — logic lives in services | **Optional (ACTEE says extract when needed)** |
| `forms/` in domain | Yes | No — forms live in components | **Move needed** |

**Complexity: HIGH** — Every existing feature file needs to be moved. Imports across the entire codebase will break and need updating.

---

### 2. State Management

| Aspect | ACTEE Requires | admin-playground Has | Gap |
|--------|---------------|---------------------|-----|
| Store technology | `signalStore` (NgRx Signals) | Angular Signals in services | **Different paradigm** |
| Domain store | `withState`, `withComputed`, `withMethods`, `withEntityResources`, `withMutations` | `BaseEntityService` with signal properties | **Full rewrite of state layer** |
| Feature store | Read-only `signalStore` with `computed` only | None | **New layer needed** |
| Data fetching | `withEntityResources` (resource-based) | `HttpClient` Observables in services | **New pattern** |
| Mutations | `withMutations` + `httpMutation` | Direct HTTP calls in service methods | **New pattern** |
| API file | `{domain}.api.ts` with resources + HttpMutationRequest | None — HTTP in BaseEntityService | **New file per domain** |

**Complexity: VERY HIGH** — This is the deepest structural change. The entire data flow model changes from "service does HTTP and exposes signals" to "store consumes resources/mutations defined in API files."

**Risk: HIGH** — NgRx Signal Store and ngrx-toolkit are new dependencies. The team must learn `withEntityResources`, `withMutations`, `httpMutation`, and `HttpMutationRequest` patterns. Bugs during migration could break all 7 feature modules simultaneously.

---

### 3. Component Architecture

| Aspect | ACTEE Requires | admin-playground Has | Gap |
|--------|---------------|---------------------|-----|
| UI ↔ data | Components talk **only to facade** | Components inject services directly | **Facade layer needed** |
| Smart components | None in features — UI is dumb | List, Detail, Form are all smart | **Refactor to dumb** |
| Pages | Compose features, no logic | Don't exist as concept | **New concept** |
| Form location | Domain owns forms | Components own form definitions | **Move forms to domain** |

**Complexity: MEDIUM-HIGH** — Every component needs its service injection replaced with facade injection. Template logic stays mostly the same.

---

### 4. Reactive Patterns

| Aspect | ACTEE Requires | admin-playground Has | Match? |
|--------|---------------|---------------------|--------|
| No Observables to UI | Yes | Partial — services use Observables internally, components subscribe | **Gap** |
| Signals only in UI | Yes | Mostly yes (services expose signals) | **Close** |
| No subscribe() | Yes | No — components use `.subscribe()` in ngOnInit | **Gap** |
| No async pipe | Yes | Yes — not used | **Match** |

**Complexity: MEDIUM** — The subscribe() calls in components need to be eliminated. With the resource/mutation pattern from ACTEE, this happens naturally.

---

### 5. What Already Aligns

| Aspect | Status |
|--------|--------|
| Standalone components (no NgModule) | Already compliant |
| Lazy-loaded routes per entity | Already compliant |
| Shared presentational components (DataTable, StatusBadge, etc.) | Already compliant |
| TypeScript strict mode | Already compliant |
| `input()` / `output()` signal-based APIs | Already compliant |
| No global state store (per-entity state) | Already compliant |
| Tailwind CSS + Angular CDK | Already compliant |
| Reactive Forms | Already compliant |
| Auth interceptor + guard pattern | Already compliant |
| Environment configuration | Already compliant |

---

## Impact Assessment per Feature Module

Each of the 7 feature modules requires the same transformation:

| Step | Files affected per module | Effort |
|------|--------------------------|--------|
| Create `domains/{entity}/` with `.store.ts`, `.api.ts`, `.models.ts` | 3 new files | Medium |
| Move business logic from `{entity}.service.ts` → domain store + api | 1 file deleted, 2 created | High |
| Create `features/{entity}/` with feature store + facade | 2 new files | Medium |
| Create `pages/{entity}/` page component | 1 new file | Low |
| Refactor list/detail/form to consume facade (not service) | 3 files modified | Medium |
| Move forms to `domains/{entity}/forms/` | 1 file moved | Low |

**Total per module: ~10 files touched/created, ~1 deleted**
**Total across 7 modules: ~70 file operations**

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **NgRx Signal Store learning curve** | High | Medium | Prototype with 1 entity first (e.g., funding-programs) |
| **ngrx-toolkit compatibility** | Medium | High | Verify version compatibility with Angular 21 before starting |
| **Regression in existing features** | High | High | Ensure test coverage before migration, migrate one module at a time |
| **Over-engineering for current scale** | Medium | Medium | ACTEE itself says "start simple, extract when complexity demands" |
| **Import path breakage** | Certain | Low | Use IDE refactoring tools, update tsconfig paths |
| **Team unfamiliarity with new patterns** | Medium | Medium | Document patterns in first migrated module |
| **BaseEntityService generic patterns lost** | Medium | Medium | Recreate in domain API files using `withEntityResources` |

---

## Effort Estimation

| Phase | Description | Relative Effort |
|-------|-------------|----------------|
| **Phase 0 — Setup** | Install @ngrx/signals, ngrx-toolkit. Create folder structure. Update tsconfig paths. | Small |
| **Phase 1 — Pilot** | Migrate `funding-programs` (simplest CRUD entity) end-to-end as reference implementation. | Medium |
| **Phase 2 — Core migration** | Migrate remaining 6 feature modules following the pilot pattern. | Large |
| **Phase 3 — Cleanup** | Remove BaseEntityService, old service files, verify no regressions. | Small |
| **Phase 4 — Shared layer** | Ensure shared components still work with facade pattern (they should — they're already presentational). | Small |

---

## Recommendations

### Option A: Full Migration (if team alignment is mandatory)
Migrate the entire codebase to ACTEE architecture. Start with a pilot module, validate the pattern, then roll out to all 7 modules. **Estimated effort: 2-3 sprints** depending on team velocity.

### Option B: Pragmatic Alignment (recommended)
ACTEE itself states: *"On commence simple (facade). On extrait quand la complexité l'exige (use-cases)."* The current admin-playground is in its early stages with simple CRUD modules. Consider:

1. **Adopt the folder structure** (domains/, features/, pages/) — this is mostly a move operation
2. **Introduce facades** as the UI entry point — medium effort, high alignment value
3. **Defer NgRx Signal Store migration** until the app grows in complexity — the current signal-based services are not far from ACTEE's spirit
4. **Introduce domain `.api.ts` files** to centralize HTTP — aligns with ACTEE without requiring withEntityResources

This gets you ~70% ACTEE-compliant without the highest-risk changes.

### Option C: Document Deviations and Continue
If admin-playground is a prototype/playground that won't be maintained long-term, document the architectural differences and continue with the current pattern. ACTEE compliance becomes relevant only when/if this codebase is promoted to production.

---

## Architect's POV: Pros & Cons Against the Product Brief

_Added: 2026-03-04_
_Perspective: Architecture Facilitator, having designed the admin-playground architecture and reviewed ACTEE in depth_

The product brief defines a very specific context: **3 internal users, 7 CRUD entities, single API consumer, v1 = operational unblocking, speed of delivery matters more than visual polish**. This context is the lens through which both architectures must be evaluated — not in the abstract.

---

### admin-playground Architecture (Current)

**What it is:** Flat feature folders, `BaseEntityService<T>` with Angular Signals, smart page components injecting services directly, no facade/domain/use-case separation. Essentially Angular CLI conventions + a generic service base.

#### Pros

| # | Pro | Why it matters for this product brief |
|---|-----|---------------------------------------|
| 1 | **Minimal indirection = fast delivery** | The brief explicitly states *"speed of delivery and completeness of coverage matter more than visual polish."* Every new entity is: create service (extends base), create 3 components, wire routes. No domain store, no facade, no feature store, no API file, no use-case. Fewer files = fewer places for bugs, faster review, faster shipping. |
| 2 | **Zero new dependencies** | The stack is pure Angular 20: HttpClient, Signals, Reactive Forms, standalone components. No `@ngrx/signals`, no `ngrx-toolkit`. No version compatibility risk with Angular upgrades. No learning curve for libraries the team hasn't used. |
| 3 | **`BaseEntityService<T>` fits the domain perfectly** | All 7 entities share CRUD + cursor pagination. The generic base eliminates duplication without introducing an abstraction layer that the brief's scope doesn't demand. Custom endpoints (publish, duplicate, assign) are clean extensions. |
| 4 | **Smart page components are the right abstraction at this scale** | With 7 entities averaging 3 components each, adding a facade between every component and its service creates ~14 extra files that do nothing but proxy calls. The product brief describes 3 tech-savvy users — there's no reusability requirement between apps, no multi-team scenario, no published component library. |
| 5 | **Observable → Signal bridge is pragmatic** | Services use `HttpClient` (Observable) internally and expose `toSignal()` to components. This is idiomatic Angular 20. The brief's users don't care about internal reactive primitives — they care about correct data on screen. |
| 6 | **Predictable for AI-assisted development** | The brief states this is a *"BMAD-driven"* project. Flat structures with consistent patterns are easier for AI agents to replicate correctly across 7 modules than layered architectures with multiple abstraction levels. |
| 7 | **Matches the product's lifecycle stage** | The brief explicitly calls this an *"early stages"* project with *"simple CRUD modules."* The architecture matches the current complexity without over-investing in structure the codebase hasn't earned yet. |

#### Cons

| # | Con | Severity in this context |
|---|-----|--------------------------|
| 1 | **No clear separation between data fetching and business logic** | **Low for v1.** The 7 entities are mostly pure CRUD. The only complex logic is indicator parameter configuration (6 params + JSONLogic rules), and even that is more UI complexity than business logic. Becomes relevant if v2 introduces computed business rules. |
| 2 | **Components directly coupled to services** | **Low.** In a 3-user internal tool with no component reuse across apps, the practical cost of this coupling is zero. It becomes a problem only if features need to be extracted into a shared library — which the brief never mentions. |
| 3 | **No facade = no single testing seam for UI** | **Medium.** Testing components requires mocking services directly. With facades, you'd mock one facade per feature. However, the brief doesn't prioritize test coverage heavily for v1, and the service mocking pattern is standard Angular. |
| 4 | **Services mix HTTP concerns with state management** | **Low.** Each service is small (CRUD + signals). The mixing is contained within a single file per entity, not scattered. Extracting HTTP into `.api.ts` files later is a minor refactor, not a rewrite. |
| 5 | **Doesn't align with team's corporate architecture (ACTEE)** | **Variable.** If this codebase gets promoted to production within the company codebase (brief mentions this as a migration path), the deviation becomes a real cost. If it stays as a standalone internal tool, the deviation is irrelevant. |

---

### ACTEE Architecture

**What it is:** Layered architecture (Domain → Feature → UI) with NgRx Signal Stores, facades, use-cases, read-only feature stores with computed-only data, strict separation of concerns, domain as single source of truth.

#### Pros

| # | Pro | Why it matters for this product brief |
|---|-----|---------------------------------------|
| 1 | **Clean separation of concerns** | Business logic (domain store), orchestration (facade), and presentation (UI) each live in dedicated files with explicit boundaries. If the product grows beyond simple CRUD (v2 business rules, cross-entity validations), the architecture already has homes for that complexity. |
| 2 | **Testability without Angular** | Domain use-cases and stores can be tested in isolation from the Angular framework. For a codebase that might be promoted to production (brief mentions company GitHub migration), this testing foundation pays dividends. |
| 3 | **Corporate architectural alignment** | If admin-playground moves to the company codebase, zero architectural migration needed. Same patterns, same folder structure, same abstractions. The team already knows ACTEE. |
| 4 | **Facade as single UI entry point** | Components only talk to facades — one dependency to mock, one contract to understand, one place to trace any UI data issue. Clean, debuggable. |
| 5 | **Read-only feature stores enforce data flow direction** | Feature stores only expose `computed` — they can't accidentally mutate domain state. This is a structural guardrail that prevents a class of bugs that grow with codebase size. |
| 6 | **Domain `.api.ts` centralizes HTTP** | All HTTP calls for an entity live in one file. Easy to audit, easy to update when the API changes (the brief notes the API is actively evolving). |

#### Cons

| # | Con | Severity in this context |
|---|-----|--------------------------|
| 1 | **Significant over-engineering for current scale** | **HIGH.** The brief describes 7 simple CRUD entities for 3 users. ACTEE itself says *"On commence simple. On extrait quand la complexité l'exige."* Applying the full ACTEE pattern to admin-playground means creating ~5 extra files per entity (domain store, API file, feature store, facade, page component) that add indirection without adding value at this stage. That's ~35 files of structural overhead. |
| 2 | **NgRx Signal Store + ngrx-toolkit = new risk** | **HIGH.** These are external dependencies not currently in the project. `ngrx-toolkit` in particular is a community library with less stability guarantees. The brief values *"speed of delivery"* — learning and debugging new library patterns directly contradicts this. `withEntityResources` and `httpMutation` are not Angular standard patterns; they're ngrx-toolkit-specific abstractions that could change. |
| 3 | **Delivery velocity impact** | **HIGH.** The brief's primary goal is *"operational unblocking"* — replacing Postman ASAP. Every extra layer (facade, feature store, domain store, API file, page component) multiplies the time to deliver each entity module. For a solo developer (AI-assisted), the overhead is pure cost with no team-coordination benefit. |
| 4 | **AI-agent complexity** | **MEDIUM.** BMAD-driven development works best with predictable, flat patterns. The layered architecture requires AI agents to understand which layer owns which responsibility, route data through multiple files, and maintain consistency across domain → feature → UI boundaries. Errors in layer placement compound across the codebase. |
| 5 | **Facade layer is pure pass-through for simple CRUD** | **MEDIUM.** For 5 of the 7 entities, the facade would literally be: `load() { this.domainStore.load(); }`, `items = this.featureStore.rows;`. This is ceremony without value — it doesn't simplify anything, it just adds a file. ACTEE acknowledges this by making use-cases optional, but doesn't acknowledge that facades themselves can be unnecessary at small scale. |
| 6 | **Feature stores with computed-only are empty for CRUD** | **LOW-MEDIUM.** When the domain store already exposes the right data shape, the feature store's computed functions are trivial identity transforms: `rows: computed(() => domainStore.items())`. The read-only constraint is architecturally sound but practically vacuous at this scale. |

---

### Head-to-Head: Which Architecture Fits the Product Brief?

| Product Brief Requirement | admin-playground | ACTEE | Winner |
|---------------------------|:----------------:|:-----:|:------:|
| *"Speed of delivery matters more than visual polish"* | Fewer files, less indirection, faster shipping | More files per entity, more ceremony | **admin-playground** |
| *"v1 goal is operational unblocking"* | Direct path: service → component → screen | Extra layers delay each entity delivery | **admin-playground** |
| *"Simple CRUD modules"* | Architecture matches simplicity | Architecture designed for higher complexity | **admin-playground** |
| *"3 internal tech-savvy users"* | No component reuse concern | Facade/feature reuse benefits don't apply | **admin-playground** |
| *"AI-assisted (BMAD-driven) development"* | Flat patterns = predictable AI output | Layered patterns = more agent errors | **admin-playground** |
| *"Stepping stone → company GitHub"* | Would need migration to ACTEE later | Zero migration cost | **ACTEE** |
| *"v2 will layer on polish and daily-use ergonomics"* | May need refactoring for complex features | Ready for complexity | **ACTEE** |
| *"Indicator parameter config (6 params + JSONLogic)"* | Works but logic lives in components | Domain use-cases cleanly own this | **ACTEE** (marginal) |
| *"Testability"* | Standard Angular testing, service mocking | Framework-free testing for business logic | **ACTEE** |

**Score: admin-playground 5 — ACTEE 3 (1 marginal)**

---

### My Recommendation

**For v1: Stay with the current admin-playground architecture.**

The product brief's priorities are unambiguous: deliver operational value fast, for 3 users, with simple CRUD. The current architecture is correctly sized for this scope. Introducing ACTEE's full layered pattern would be the textbook definition of *"over-engineering for current scale"* — a risk the comparison report's own risk matrix already identifies.

**For the company migration path:** If/when admin-playground is promoted to the company codebase:

1. **Introduce facades first** — this is the highest-value ACTEE alignment step (components stop talking to services directly) and the lowest-risk one (no new dependencies, no state management rewrite)
2. **Adopt the folder structure** (domains/, features/, pages/) — mostly a move operation
3. **Evaluate NgRx Signal Store at that point** — by then, the team will know if the app's complexity actually demands it, and `ngrx-toolkit` compatibility with the current Angular version can be verified

This matches ACTEE's own philosophy: *"On commence simple. On extrait quand la complexité l'exige."* The complexity hasn't demanded it yet.

---

## Conclusion

The admin-playground and ACTEE architecture share the same **philosophical goals** (separation of concerns, testability, signal-based reactivity) but differ significantly in **structural implementation** (flat services vs. layered stores/facades/use-cases). The codebase is small enough that migration is technically feasible, but the NgRx Signal Store + ngrx-toolkit dependency introduces the highest risk. A pragmatic, incremental approach (Option B) balances team alignment with delivery velocity.
