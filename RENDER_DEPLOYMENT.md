# 🚀 Render Deployment Guide

This guide covers deploying the Paraphraser API to Render with full Python + Node.js support.

## Prerequisites

1. A Render account
2. A Hugging Face account with API access
3. Your repository connected to Render

## Deployment Steps

### 1. Deploy to Render

1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` configuration
3. No additional environment variables needed - the system uses Python AI with Advanced fallback

### 2. Configuration DetailsThe deployment includes:

- **Runtime**: Node.js with Python 3 support
- **Build**: Python dependencies installation + Node.js build
  ```bash
  python3 -m pip install --user -r requirements.txt
  npm ci && npm run build
  ```
- **Start**: `npm run start:prod`
- **Health Check**: `/paraphrase/health` endpoint
- **Python Dependencies**: transformers, torch, sentencepiece, protobuf
- **Scaling**: Single instance (starter plan)

### 3. Environment Variables

Automatically configured environment variables:

- `NODE_ENV`: production (auto-set)
- `PORT`: 10000 (auto-set by Render)

Optional environment variables:

- `THROTTLE_TTL`: 60 (rate limit window in seconds)
- `THROTTLE_LIMIT`: 10 (requests per window)

### 4. API Endpoints

Once deployed, your API will be available at `https://your-app-name.onrender.com`

**Health Check:**

```
GET /health
```

**Paraphrase Text:**

```
POST /paraphrase
Content-Type: application/json

{
  "text": "Your text to paraphrase",
  "style": "creative"
}
```

**Available Styles:**

- `simple`: Basic paraphrasing
- `advanced`: Enhanced vocabulary and structure
- `creative`: Most creative with AI assistance
- `formal`: Professional tone
- `casual`: Conversational tone

### 6. Testing the Deployment

```bash
# Health check (shows all service status)
curl https://your-app-name.onrender.com/paraphrase/health

# Test Python AI paraphrasing (creative, formal, casual styles)
curl -X POST https://your-app-name.onrender.com/paraphrase \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world, this is a test sentence.", "style": "creative"}'

# Test simple paraphrasing
curl -X POST https://your-app-name.onrender.com/paraphrase \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "style": "simple"}'
```

### 7. Monitoring

- Check logs in the Render dashboard for Python/Node.js processes
- Monitor the health endpoint at `/paraphrase/health`
- Python AI logs show model loading and generation status
- The API includes comprehensive error handling and fallbacks

### 8. Python Dependencies

The app automatically installs these Python packages during build:

- `transformers==4.44.2` - Hugging Face transformers library
- `torch==2.4.1` - PyTorch for model inference
- `sentencepiece==0.2.0` - Tokenization for T5 model
- `protobuf==5.28.2` - Protocol buffers for model serialization

### 9. Scaling

For higher traffic:

1. Upgrade to a higher Render plan (more memory for T5 model)
2. Adjust `THROTTLE_LIMIT` and `THROTTLE_TTL` as needed
3. Consider enabling auto-scaling in render.yaml
4. Monitor Python model memory usage (~1GB for T5)

## Architecture Notes

The API uses a smart fallback system:

1. **Python AI** (T5 model) - Primary for creative styles
2. **Cloud AI** (Hugging Face API) - Fallback for AI processing
3. **Advanced** - Algorithmic paraphrasing
4. **Simple** - Rule-based paraphrasing

This ensures high availability even if individual services fail.
