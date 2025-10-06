#!/bin/bash

echo "🚀 Preparing for Railway deployment..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Test health check
echo "🧪 Testing health check..."
npm start &
SERVER_PID=$!
sleep 5

# Wait for server to start
for i in {1..10}; do
    if curl -f http://localhost:3000/paraphrase/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
        kill $SERVER_PID
        break
    else
        echo "⏳ Waiting for server to start... ($i/10)"
        sleep 2
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Health check failed"
        kill $SERVER_PID
        exit 1
    fi
done

echo "🎉 Ready for Railway deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Go to https://railway.app"
echo "3. Connect your repository"
echo "4. Set environment variables:"
echo "   - NODE_ENV=production"
echo "   - USE_AI_PARAPHRASE=false"
echo "   - USE_ADVANCED_PARAPHRASE=true"
echo "5. Deploy!"
echo ""
echo "📖 See RAILWAY_DEPLOYMENT.md for detailed instructions"