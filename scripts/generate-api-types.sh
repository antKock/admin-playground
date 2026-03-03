#!/usr/bin/env bash
set -euo pipefail

SPEC_URL="https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json"
OUTPUT_FILE="src/app/core/api/generated/api-types.ts"

echo "Generating API types from: $SPEC_URL"
npx openapi-typescript "$SPEC_URL" -o "$OUTPUT_FILE"
echo "Types generated at: $OUTPUT_FILE"
