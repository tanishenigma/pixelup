#!/bin/bash
# Test backend locally with Docker
# This allows you to verify the backend works before deploying to Cloud Run

set -e

IMAGE_NAME="pixelup-backend-local"
CONTAINER_NAME="pixelup-backend-test"
PORT=5000

echo "🐳 Building and testing backend locally with Docker..."
echo ""

# Stop and remove existing container if running
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo "🛑 Stopping existing container..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

# Build the image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME -f backend/Dockerfile .

# Run the container
echo "🚀 Starting container..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:8080 \
    -e MODEL_DIR=/app/model \
    -e MODEL_NAME=RealESRGAN_General_x4_v3 \
    $IMAGE_NAME

echo ""
echo "✅ Backend is running locally!"
echo ""
echo "🔗 Endpoints:"
echo "   Health: http://localhost:$PORT/health"
echo "   Process: http://localhost:$PORT/process"
echo ""
echo "📝 Test commands:"
echo "   # Health check"
echo "   curl http://localhost:$PORT/health"
echo ""
echo "   # Process test image"
echo "   curl -F 'file=@./test.jpg' http://localhost:$PORT/process | jq"
echo ""
echo "📊 Container logs:"
echo "   docker logs -f $CONTAINER_NAME"
echo ""
echo "🛑 Stop container:"
echo "   docker stop $CONTAINER_NAME"
echo ""

# Wait a moment for container to start
sleep 3

# Test health endpoint
echo "🧪 Testing health endpoint..."
if curl -s http://localhost:$PORT/health | grep -q "healthy"; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed. Checking logs:"
    docker logs $CONTAINER_NAME
fi

echo ""
echo "💡 Update your .env to use local backend:"
echo "   echo 'VITE_BACKEND_URL=http://localhost:$PORT' > .env"
echo "   npm run dev"
echo ""
