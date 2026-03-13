#!/usr/bin/env bash
set -euo pipefail

SPEC_JSON="src/app/core/api/generated/openapi-spec.json"
BASELINE_JSON="src/app/core/api/generated/openapi-baseline.json"

if [ ! -f "$SPEC_JSON" ]; then
  echo "Error: $SPEC_JSON not found. Run 'npm run api:generate' first."
  exit 1
fi

cp "$SPEC_JSON" "$BASELINE_JSON"
echo "Baseline updated. The API change detection banner will no longer appear for current changes."
