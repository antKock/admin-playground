#!/usr/bin/env bash
set -euo pipefail

SPEC_URL="https://laureatv2-api-staging.osc-fr1.scalingo.io/openapi.json"
OUTPUT_FILE="src/app/core/api/generated/api-types.ts"
SPEC_JSON="src/app/core/api/generated/openapi-spec.json"

echo "Downloading OpenAPI spec from: $SPEC_URL"
curl -sf "$SPEC_URL" -o "$SPEC_JSON"
echo "Spec saved to: $SPEC_JSON"

echo "Generating API types..."
npx openapi-typescript "$SPEC_JSON" -o "$OUTPUT_FILE"
echo "Types generated at: $OUTPUT_FILE"

echo ""
echo "NOTE: The API change detection banner will remain visible until you run:"
echo "  npm run api:acknowledge"
