#!/usr/bin/env bash
set -euo pipefail

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "ERROR: AUTH_SECRET must be set in the environment before deploy." >&2
  echo "Example: export AUTH_SECRET=\$(openssl rand -base64 32)" >&2
  exit 1
fi
if [ "$AUTH_SECRET" = "dev-secret-change-me" ] || [ "$AUTH_SECRET" = "replace-with-strong-random-secret" ]; then
  echo "ERROR: AUTH_SECRET must not be a placeholder value." >&2
  exit 1
fi

PROJECT_ID="pianopia"
PRODUCT_ID="septcode-api"
REPOSITORY="septcode"
REGION="asia-east1"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$PRODUCT_ID:latest"

gcloud config set project "$PROJECT_ID"
gcloud artifacts repositories create "$REPOSITORY" --repository-format=docker --location="$REGION" --description="Docker images" 2>/dev/null || true
docker buildx build -t "$IMAGE" --platform linux/amd64 -f ../api/Dockerfile ..
docker push "$IMAGE"
gcloud run deploy "$PRODUCT_ID" --image "$IMAGE" --platform managed \
  --set-env-vars "NODE_ENV=production,AUTH_SECRET=${AUTH_SECRET}" \
  --region="$REGION"
gcloud run services update-traffic "$PRODUCT_ID" --to-latest --region="$REGION"
