#!/bin/bash
# deploy.sh — Deploy Sentience Finance to Google Cloud Run
# Requires: gcloud CLI authenticated, billing enabled on project

set -e

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-equivoice-3bb28}"
REGION="us-central1"
SERVICE="sentience-finance"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE"

echo "▶ Building container image…"
gcloud builds submit --tag "$IMAGE" --project "$PROJECT_ID"

echo "▶ Deploying to Cloud Run…"
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_API_KEY=$GOOGLE_API_KEY,FIREBASE_KEY_BASE64=$FIREBASE_KEY_BASE64" \
  --project "$PROJECT_ID"

echo ""
echo "✅ Deployed. Service URL:"
gcloud run services describe "$SERVICE" \
  --region "$REGION" \
  --format "value(status.url)" \
  --project "$PROJECT_ID"
