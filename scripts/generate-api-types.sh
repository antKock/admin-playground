#!/usr/bin/env bash
set -euo pipefail

SPEC_URL="https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json"
OUTPUT_FILE="src/app/core/api/generated/api-types.ts"

BASELINE_FILE=".openapi-baseline.sha256"

echo "Generating API types from: $SPEC_URL"
npx openapi-typescript "$SPEC_URL" -o "$OUTPUT_FILE"
echo "Types generated at: $OUTPUT_FILE"

echo "Updating OpenAPI baseline hash..."
SPEC_HASH=$(curl -sf "$SPEC_URL" | shasum -a 256 | awk '{print $1}')
echo "$SPEC_HASH" > "$BASELINE_FILE"
echo "Baseline hash saved to: $BASELINE_FILE ($SPEC_HASH)"
