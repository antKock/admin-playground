# Epic 3 Implementation Readiness Assessment Report

**Date:** 2026-03-04
**Project:** admin-playground
**Focus:** Epic 3 — Indicator Models & Parameter Configuration

---

## stepsCompleted: [step-01-document-discovery, step-02-prd-analysis, step-03-epic-coverage, step-04-ux-alignment, step-05-epic-quality-review, step-06-final-assessment]

### Documents Included in Assessment:
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epics & Stories: `_bmad-output/planning-artifacts/epics.md`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md`
- API Observations: `_bmad-output/api-observations.md`
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Story Spec Files Assessed:
- `3-1-indicator-models-crud-with-actee-pattern.md`
- `3-2-indicator-model-type-subtype-list-values-management.md`
- `3-3-indicator-model-status-workflow-usage-visibility.md`
- `3-4-attach-indicator-models-to-action-models.md`
- `3-5-indicator-parameter-configuration-6-parameters.md`
- `3-6-jsonlogic-rule-input-for-indicator-parameters.md`

---

## PRD Analysis — Epic 3-Relevant FRs

Epic 3 is responsible for delivering:
- **FR7-FR12** (for Indicator Models): CRUD, pagination, detail, delete
- **FR13, FR15, FR16** (for IM): Status transitions, invalid transition blocking, status visibility
- **FR20**: Attach Indicator Models to Action Model
- **FR21**: "Used in N models" visibility
- **FR22**: Association metadata management
- **FR23**: 6-parameter configuration
- **FR24**: JSONLogic rule input (v1 basic)
- **FR25**: Indicator type/subtype management
- **FR26**: List values management
- **FR27**: Type-change constraint with explanation
- **FR28**: Parameter/rule visibility

**Total Epic 3-relevant FRs: 17**

---

## Epic Coverage Validation

| FR | PRD Requirement | Epic 3 Story | Status |
|----|----------------|--------------|--------|
| FR7 | Paginated entity list (IM) | Story 3.1 | ✓ Covered |
| FR8 | Entity list filtering (IM) | Story 3.1 / Epic 4 | ✓ Covered |
| FR9 | Entity detail view (IM) | Story 3.1 | ✓ Covered |
| FR10 | Create entity (IM) | Story 3.1 | ✓ Covered |
| FR11 | Edit entity (IM) | Story 3.1 | ✓ Covered |
| FR12 | Delete with confirmation (IM) | Story 3.1 | ✓ Covered |
| FR13 | Status transitions (IM) | Story 3.3 | ⚠️ BLOCKED — no API `status` field |
| FR15 | Invalid transition blocking (IM) | Story 3.3 | ⚠️ BLOCKED — no API `status` field |
| FR16 | Status visibility (IM) | Story 3.3 | ⚠️ BLOCKED — no API `status` field |
| FR20 | Attach Indicator Models to AM | Story 3.4 | ✓ Covered |
| FR21 | "Used in N models" visibility | Story 3.3 | ✓ Covered |
| FR22 | Association metadata mgmt | Story 3.5 | ✓ Covered (⚠️ API round-trip unverified) |
| FR23 | 6-parameter configuration | Story 3.5 | ✓ Covered (⚠️ API round-trip unverified) |
| FR24 | JSONLogic rule input (basic) | Story 3.6 | ✓ Covered (⚠️ API round-trip unverified) |
| FR25 | Indicator type/subtype mgmt | Story 3.2 | ⚠️ Partial — type only (no subtype in API) |
| FR26 | List values management | Story 3.2 | ❌ NOT DELIVERABLE — no API support |
| FR27 | Type-change constraint | Story 3.2 | ❌ NOT DELIVERABLE — no API `status` field |
| FR28 | Parameter/rule visibility | Story 3.5/3.6 | ✓ Covered |

### Coverage Statistics
- **Total FRs:** 17
- **Fully covered:** 10 (59%)
- **Partially covered / at risk:** 4 (24%) — FR22, FR23, FR24, FR25
- **Blocked by API:** 3 (18%) — FR13, FR15, FR16
- **Not deliverable:** 2 (12%) — FR26, FR27
- **Effective v1 coverage (excluding API-blocked):** 12/17 FRs

---

## UX Alignment Assessment

### UX ↔ Story Alignment

| UX Component | Story | Alignment |
|---|---|---|
| IndicatorCard (expandable, drag handle, 6x ToggleRow body) | 3.4, 3.5 | ✓ Aligned |
| ToggleRow (toggle switch + rule expansion) | 3.5, 3.6 | ✓ Aligned |
| RuleField (monospace textarea + variable extraction) | 3.6 | ✓ Aligned |
| IndicatorPicker (searchable attach panel) | 3.4 | ✓ Aligned |
| ParamHintIcons (6 circles, 3 states each) | 3.5 | ✓ Aligned |
| SaveBar (sticky bottom, unsaved count, discard/save) | 3.5 | ✓ Aligned |
| CDK DragDrop (indicator reordering) | 3.4 | ✓ Aligned |
| StatusBadge for IM | 3.3 | ⚠️ N/A — no API `status` field |

**No UX ↔ story misalignments.** All components have matching acceptance criteria. The StatusBadge for Indicator Models can't render because there's no status to display.

---

## Epic Quality Review

### Story Quality Assessment

| Story | Value | Independence | ACs | API Schema | Anti-patterns | Files Listed |
|-------|-------|-------------|-----|------------|--------------|-------------|
| 3.1 | ✅ | ✅ Independent | 8 ACs ✅ | ✅ Full | ✅ | ✅ |
| 3.2 | 🟡 Thin | ✅ Depends on 3.1 | 5 ACs ✅ | ✅ Gap noted | ✅ | ✅ |
| 3.3 | ✅ | ✅ Depends on 3.1 | 4 ACs ✅ | ✅ Gap noted | ✅ | ✅ |
| 3.4 | ✅ | ✅ Depends on 3.1 + E1 AM | 7 ACs ✅ | ✅ Full | ✅ | ✅ |
| 3.5 | ✅ | ✅ Depends on 3.4 | 8 ACs ✅ | ✅ Full | ✅ | ✅ |
| 3.6 | ✅ | ✅ Depends on 3.5 | 7 ACs ✅ | ✅ Full | ✅ | ✅ |

### Findings by Severity

#### 🔴 Critical — Pre-Implementation Blockers

**CV-1: Association metadata API round-trip UNVERIFIED**

`IndicatorModelAssociationInput` has 6 parameters (`visibility_rule`, `required_rule`, `editable_rule`, `default_value_rule`, `duplicable`, `constrained_values`). Nobody has verified the API actually persists and returns these correctly via `PUT /action-models/{id}`.

- **Impact:** If the backend ignores metadata fields, **Stories 3-4, 3-5, and 3-6 all fail at runtime** — that's 50% of the epic.
- **Action:** Run a manual API test **before starting any Story 3-4+ development**: PUT with full `indicator_model_associations`, GET back, verify round-trip.
- **Effort:** 5 minutes.
- **Priority:** CRITICAL — must be done before development begins.

#### 🟠 Major Issues

**MI-1: No `status` field on IndicatorModelRead — FR13, FR15, FR16 blocked**

The API has no `status`, no transition endpoints, no `next_possible_statuses` for Indicator Models. Story 3-3 correctly scopes down to "usage visibility" only.

- **Impact:** The epic's FR claim of "FR13, FR16" for Indicator Models is not deliverable.
- **Recommendation:** Accept as API limitation for v1. Document in api-observations.md (already done). Update epic FR coverage to reflect "FR13, FR16 (deferred — pending API support)".

**MI-2: FR25, FR26, FR27 partially or fully undeliverable**

- FR25 (subtype): API only has `type: "text" | "number"` — no subtype field.
- FR26 (list values): No API endpoints or fields for list value management.
- FR27 (type-change constraint): Requires status field to block changes on published models.
- **Recommendation:** These are API gaps, not story spec failures. The story specs correctly scope down and document gaps. Accept for v1.

**MI-3: Story 3-3 usage visibility won't scale beyond 100 action models**

`loadUsage()` fetches action models with `limit: 100` and filters client-side. No pagination for the usage query.

- **Recommendation:** Acceptable for v1 (small dataset). Document as API observation: suggest dedicated `GET /indicator-models/{id}/action-models` endpoint. Add a client-side warning if count exceeds 100.

#### 🟡 Minor Concerns

**MC-1: Story 3.2 is very thin after API scoping**

Only delivers: type `<select>` on form, type badge in list/detail, API gap documentation. Could be merged into Story 3.1.

**MC-2: Story 3.5 without 3.6 delivers limited toggle UX**

Toggles can only set "true"/"false" until Story 3.6 adds RuleField. By design (incremental delivery), but intermediate state has limited value for operators who need custom rules.

**MC-3: Test coverage expectations not consistently specified across stories**

Story 3.1 mentions domain store spec and facade spec. Other stories don't specify which test files need updating.

---

## Summary and Recommendations

### Overall Readiness Status

## ⚠️ CONDITIONALLY READY — 1 critical pre-condition must be met

### Critical Pre-Condition (MUST DO BEFORE DEVELOPMENT)

**Verify IndicatorModelAssociationInput API round-trip.** Run a manual test:
1. `PUT /action-models/{id}` with `indicator_model_associations` containing all 6 parameters
2. `GET /action-models/{id}` and verify the 6 parameters came back correctly
3. If round-trip works → proceed with Epic 3 development
4. If round-trip fails → Stories 3-4, 3-5, 3-6 need redesign or API changes

**Effort:** 5 minutes. **Risk mitigated:** 3 stories (50% of epic).

### Assessment Summary

| Area | Result | Issues |
|------|--------|--------|
| **Document Discovery** | ✅ All docs + 6 story specs found | 0 |
| **PRD FR Coverage** | ⚠️ 12/17 FRs deliverable, 5 blocked/partial | 5 API gaps |
| **UX Alignment** | ✅ All components aligned to stories | 0 |
| **Epic Quality** | ✅ Good structure, clear scoping | 1 critical, 3 major, 3 minor |
| **Story Spec Quality** | ✅ Excellent — comprehensive dev notes, schemas, anti-patterns | 0 |

### Issues to Address Before Implementation

1. **[CRITICAL] Run association metadata API round-trip test** (5 min, de-risks 3 stories)
2. **[MAJOR] Acknowledge FR13/FR15/FR16 are blocked** for Indicator Models — update epic FR mapping or accept
3. **[MAJOR] Acknowledge FR25 (partial), FR26, FR27 are not deliverable** — API gaps, not story failures

### Recommended Implementation Order

1. **Story 3.1** — Indicator Models CRUD (independent, establishes ACTEE module)
2. **Story 3.2** — Type/subtype (thin, quick to deliver after 3.1)
3. **Story 3.3** — Usage visibility (can run parallel with 3.2 after 3.1)
4. **Run association metadata API test** ← GATE before proceeding
5. **Story 3.4** — Attach indicators to Action Models (creates shared components)
6. **Story 3.5** — 6-parameter configuration (extends indicator cards)
7. **Story 3.6** — JSONLogic rule input (extends toggle rows)

### Strengths Identified

- **Excellent story spec quality** — API schemas, anti-patterns, file lists, cross-domain patterns all documented
- **API gaps honestly acknowledged** — stories correctly scope down rather than faking unsupported features
- **Cross-domain architecture clearly defined** — Action Model facade orchestrates indicator model data
- **UX components fully specified** — IndicatorCard, ToggleRow, RuleField, IndicatorPicker, ParamHintIcons all have clear inputs/outputs
- **Incremental delivery** — stories build on each other logically (3.1→3.2/3.3→3.4→3.5→3.6)

### Final Note

This assessment identified **7 issues** across **3 severity levels** (1 critical, 3 major, 3 minor). The story specs themselves are **well-crafted** — the issues are almost entirely API-driven (missing status field, unverified association metadata). The one critical action item (5-minute API test) should be completed before starting Story 3.4 development.

**Assessed by:** Implementation Readiness Workflow
**Date:** 2026-03-04
**Project:** admin-playground — Epic 3: Indicator Models & Parameter Configuration
