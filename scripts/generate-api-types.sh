#!/usr/bin/env bash
set -euo pipefail

SPEC_URL="https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json"
OUTPUT_FILE="src/app/core/api/generated/api-types.ts"
BASELINE_JSON="src/app/core/api/generated/openapi-baseline.json"

echo "Downloading OpenAPI spec from: $SPEC_URL"
curl -sf "$SPEC_URL" -o "$BASELINE_JSON"
echo "Baseline spec saved to: $BASELINE_JSON"

echo "Generating API types from local baseline..."
npx openapi-typescript "$BASELINE_JSON" -o "$OUTPUT_FILE"
echo "Types generated at: $OUTPUT_FILE"
