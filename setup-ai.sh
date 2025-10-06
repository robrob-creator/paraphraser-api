#!/bin/bash

echo "🚀 Setting up AI Paraphrasing Environment..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3."
    exit 1
fi

echo "✅ pip3 found"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd scripts
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Test the Python script
echo "🧪 Testing Python paraphrasing script..."
python3 paraphrase_model.py "This is a test sentence." simple 2

if [ $? -eq 0 ]; then
    echo "✅ Python script is working correctly"
    echo ""
    echo "🎉 Setup complete! You can now use AI paraphrasing by setting:"
    echo "   USE_AI_PARAPHRASE=true"
    echo ""
    echo "📝 Add this to your .env file or environment variables"
else
    echo "⚠️  Python script test failed. The model download might take time on first run."
    echo "   This is normal for the first execution as it downloads the T5 model."
fi

cd ..