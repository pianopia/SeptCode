#!/usr/bin/env bash
PROJECT_ID="pianopia"
PRODUCT_ID="septcode-api"
REPOSITORY="septcode"
REGION="asia-east1"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$PRODUCT_ID:latest"

gcloud config set project "$PROJECT_ID"
gcloud artifacts repositories create "$REPOSITORY" --repository-format=docker --location="$REGION" --description="Docker images" 2>/dev/null || true
docker buildx build -t "$IMAGE" --platform linux/amd64 -f ../api/Dockerfile ..
docker push "$IMAGE"
gcloud run deploy "$PRODUCT_ID" --image "$IMAGE" --platform managed --set-env-vars NODE_ENV=production --region="$REGION"
gcloud run services update-traffic "$PRODUCT_ID" --to-latest --region="$REGION"
