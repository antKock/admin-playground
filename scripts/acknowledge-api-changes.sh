#!/usr/bin/env bash
set -euo pipefail

# Marks the current API spec as "acknowledged" by the codebase.
# This removes the yellow change-detection banner in the app.
#
# Full workflow when the banner appears:
#   1. npm run api:generate     — download latest spec + regenerate TS types
#   2. Adapt code to the new/changed API
#   3. npm run api:acknowledge  — run THIS script (copies spec → baseline)
#   4. git commit the updated openapi-baseline.json

SPEC_JSON="src/app/core/api/generated/openapi-spec.json"
BASELINE_JSON="src/app/core/api/generated/openapi-baseline.json"

if [ ! -f "$SPEC_JSON" ]; then
  echo "Error: $SPEC_JSON not found. Run 'npm run api:generate' first."
  exit 1
fi

cp "$SPEC_JSON" "$BASELINE_JSON"
echo "✓ Baseline updated."
echo ""
echo "Don't forget to commit the updated baseline:"
echo "  git add $BASELINE_JSON && git commit -m 'Acknowledge API changes'"
