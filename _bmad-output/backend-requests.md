# Backend Requests

Open requests from frontend to backend. Verified at each API changelog review — items are closed when resolved by API changes.

---

## P1 — High priority

### 16. Section endpoints ignore rule values — PUT returns 200 but doesn't persist
**Reported:** 2026-03-28 (staging UAT — section param editing)
**Impact:** All section parameter editing is broken. Frontend sends correct payloads, backend returns 200 but values are unchanged in the response.
**Affected endpoints (both have the same bug):**
1. **Section params:** `PUT .../sections/{section_id}` — rule fields in the request body are ignored
2. **Section indicator params:** `PUT .../sections/{section_id}/indicators` — indicator rule fields in the array entries are ignored
**Evidence — section params:**
- Payload: `{ "required_rule": "true", ... }`
- Response (200): `{ "required_rule": "false", ... }` — not updated
- `last_updated_at` IS updated, confirming the PUT was processed but rules were ignored
**Evidence — section indicator params:**
- Payload: `[{ "indicator_model_id": "f9d2bf01-...", "required_rule": "true", ... }]`
- Response (200): child indicator `required_rule` remains `"false"`
- Parent indicator rules also not persisted (e.g., `hidden_rule: "true"` in payload, `"false"` in response)
**Affects:** All model types (action-models, folder-models, entity-models) — all 3 share the same `SectionModelUpdate` and `SectionIndicatorAssociationInput` schemas.
**Request:** Fix both PUT handlers to actually persist rule field values from the request body.

### 15. Reject root-level indicator associations on action models
**Reported:** 2026-03-28 (section-only indicator migration)
**Impact:** Data integrity — action models should only have indicators inside sections, never at root level. The frontend no longer sends `indicator_model_associations` or `indicator_model_ids` on action model create/update, but the API still accepts them.
**Details:**
- `ActionModelCreate` and `ActionModelUpdate` both still accept `indicator_model_associations` and `indicator_model_ids` fields
- The frontend has been updated to manage all indicator associations exclusively through section endpoints (`PUT /action-models/{id}/sections/{section_id}/indicators`)
- Any existing root-level associations should be migrated into the appropriate section
- After migration, the backend should reject `indicator_model_associations` and `indicator_model_ids` on action model create/update (return 422 or ignore the fields)
**Request:** (1) Migrate any existing root-level indicator associations on action models into their sections. (2) Remove or reject `indicator_model_associations` / `indicator_model_ids` from `ActionModelCreate` and `ActionModelUpdate` schemas.
