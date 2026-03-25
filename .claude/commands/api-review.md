---
name: 'api-review'
description: 'Review API changes, update changelog, and check backend requests. Use when the user says "review API changelog", "check API changes", or "api review"'
---

# API Review — Detect changes, log actions, and track backend requests

You are performing an API changelog review for the admin-playground frontend. This is a structured process with clear steps.

## Context files

- **API changelog**: `_bmad-output/api-changelog.md` — tracks changesets with actions and opportunities
- **Backend requests**: `_bmad-output/backend-requests.md` — open requests to backend team
- **Baseline spec**: `src/app/core/api/generated/openapi-baseline.json` — last acknowledged API state
- **Current spec**: `src/app/core/api/generated/openapi-spec.json` — last downloaded API state
- **Generated types**: `src/app/core/api/generated/api-types.ts` — TypeScript types from spec

## Process

### Step 1 — Fetch latest spec & detect changes

1. Run `npm run api:generate` to download the latest OpenAPI spec and regenerate types
2. Compare `openapi-spec.json` (new) against `openapi-baseline.json` (current baseline)
3. If no changes detected, inform the user and skip to Step 4
4. If changes detected, list them categorized as:
   - **Schema changes**: modified/added/removed schemas
   - **Endpoint changes**: modified/added/removed paths
   - **Parameter changes**: new filters, query params, etc.

### Step 2 — Create changeset in api-changelog.md

Read `_bmad-output/api-changelog.md` and insert the new changeset section **at the top** (after the header/rules block and the `---` separator). Changesets are ordered most recent first.

For each detected change, determine if it's an **Action** (mechanical frontend adaptation needed) or an **Opportunity** (new capability that could be leveraged).

**Actions** = changes to existing schemas/endpoints the frontend already uses. These require adaptation.
- Scan the codebase (`src/app/`) to identify which components, services, stores, and types are affected
- Create one action per impacted area with a clear description of what needs to change
- Status: `to do`

**Opportunities** = new endpoints, new schemas, or new capabilities not yet used by the frontend.
- Describe the capability and suggest how it could be integrated based on existing UX patterns
- Reference similar existing implementations (e.g., "like the Sites CRUD pattern")
- Status: `to evaluate`

Format:

```markdown
## Changeset: YYYY-MM-DD HH:mm — Pending

### Actions
| Change | Action | Status |
|--------|--------|--------|
| ... | ... | `to do` |

### Opportunities
| Capability | Description | Recommendation | Status |
|------------|-------------|----------------|--------|
| ... | ... | ... | `to evaluate` |
```

### Step 3 — Cross-check backend-requests.md

Read `_bmad-output/backend-requests.md` and check if any open requests have been resolved by the new API changes:
- If an open request is now resolved → move it to the Closed table with today's date
- If partially resolved → update the item with current status
- Present changes to the user for validation

### Step 4 — Check pending changesets for baseline reset eligibility

Review all changesets in `api-changelog.md` marked as **Pending**. A changeset can be marked **Applied** when:
- ALL actions are `done` or `declined`
- ALL opportunities are `to do`, `done`, or `declined` (only `to evaluate` blocks reset)

If a changeset is eligible:
1. Inform the user and ask for confirmation
2. Run `npm run api:acknowledge` to copy spec → baseline
3. Update the changeset header: `## Changeset: YYYY-MM-DD HH:mm — Applied (baseline reset: YYYY-MM-DD HH:mm)`
4. Remind the user to commit the updated `openapi-baseline.json`

### Step 5 — Summary

Present a concise summary to the user:
- Number of changes detected
- Actions created (with `to do` count)
- Opportunities identified (with `to evaluate` count)
- Backend requests closed
- Baseline reset status

## Rules

- `declined` actions/opportunities MUST include a brief justification in the description
- When recommending opportunities, base UX/UI suggestions on existing patterns in the codebase — don't invent new patterns
- Always verify impact by scanning the actual code, don't guess which files are affected
- If `npm run api:generate` fails (e.g., API unreachable), inform the user and work with the existing `openapi-spec.json` if available
- **Timestamps**: always run `date '+%Y-%m-%d %H:%M'` to get the real local time for changeset headers — never guess or use internal clock
