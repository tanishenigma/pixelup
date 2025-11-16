#!/bin/bash
# Backend deployment script for Cloud Run
# Run this script from your local machine with gcloud CLI installed

set -e

PROJECT_ID="twitter-clone-f1d5b"
SERVICE_NAME="pixelup-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying PixelUp backend to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Set the active project
echo "📌 Setting active project..."
gcloud config set project $PROJECT_ID

# Build and push the Docker image
echo "🐳 Building Docker image..."
docker build -t $IMAGE_NAME -f backend/Dockerfile .

echo "📤 Pushing image to GCR..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars MODEL_DIR=/app/model,MODEL_NAME=RealESRGAN_General_x4_v3

echo ""
echo "✅ Backend deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Note the service URL from the output above"
echo "2. Update .env file with: VITE_BACKEND_URL=<YOUR_CLOUD_RUN_URL>"
echo "3. Rebuild and redeploy frontend:"
echo "   npm run build"
echo "   firebase deploy --only hosting"
echo ""
