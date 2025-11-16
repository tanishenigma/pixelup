#!/bin/bash
# Apply CORS configuration to Firebase Storage bucket
# Run this script from your local machine with gcloud SDK (gsutil) installed

set -e

PROJECT_ID="twitter-clone-f1d5b"
BUCKET_NAME="${PROJECT_ID}.appspot.com"
CORS_FILE="storage.cors.json"

echo "🔧 Applying CORS configuration to Firebase Storage..."
echo "Bucket: gs://$BUCKET_NAME"
echo "CORS file: $CORS_FILE"
echo ""

# Check if gsutil is available
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: gsutil not found!"
    echo ""
    echo "Please install Google Cloud SDK:"
    echo "  https://cloud.google.com/sdk/docs/install"
    echo ""
    echo "Or apply CORS manually via Google Cloud Console:"
    echo "  1. Go to: https://console.cloud.google.com/storage/browser"
    echo "  2. Select bucket: $BUCKET_NAME"
    echo "  3. Click 'Permissions' tab"
    echo "  4. Add CORS configuration from $CORS_FILE"
    exit 1
fi

# Apply CORS
echo "📤 Applying CORS configuration..."
gsutil cors set $CORS_FILE gs://$BUCKET_NAME

echo ""
echo "✅ CORS configuration applied successfully!"
echo ""
echo "To verify:"
echo "  gsutil cors get gs://$BUCKET_NAME"
echo ""
