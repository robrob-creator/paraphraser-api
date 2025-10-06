# 🚀 Render Deployment Guide

This guide covers deploying the Paraphraser API to Render with full Python + Node.js support.

## Prerequisites

1. A Render account
2. A Hugging Face account with API access
3. Your repository connected to Render

## Deployment Steps

### 1. Create Hugging Face API Token

1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Create a new token with "Read" access
3. Copy the token for step 3

### 2. Deploy to Render

1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` configuration
3. In the Render dashboard, add the following environment variable:
   - **HUGGINGFACE_API_KEY**: Your Hugging Face token from step 1

### 3. Configuration Details

The deployment includes:
- **Runtime**: Node.js with Python support
- **Build**: `npm ci && npm run build`
- **Start**: `npm run start:prod`
- **Health Check**: `/health` endpoint
- **Scaling**: Single instance (starter plan)

### 4. Environment Variables

Required environment variables:
- `HUGGINGFACE_API_KEY`: Your Hugging Face API token
- `NODE_ENV`: production (auto-set)
- `PORT`: 10000 (auto-set by Render)

Optional environment variables:
- `THROTTLE_TTL`: 60 (rate limit window in seconds)
- `THROTTLE_LIMIT`: 10 (requests per window)

### 5. API Endpoints

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
# Health check
curl https://your-app-name.onrender.com/health

# Test paraphrasing
curl -X POST https://your-app-name.onrender.com/paraphrase \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "style": "creative"}'
```

### 7. Monitoring

- Check logs in the Render dashboard
- Monitor the health endpoint
- The API includes comprehensive error handling and fallbacks

### 8. Scaling

For higher traffic:
1. Upgrade to a higher Render plan
2. Adjust `THROTTLE_LIMIT` and `THROTTLE_TTL` as needed
3. Consider enabling auto-scaling in render.yaml

## Architecture Notes

The API uses a smart fallback system:
1. **Python AI** (T5 model) - Primary for creative styles
2. **Cloud AI** (Hugging Face API) - Fallback for AI processing
3. **Advanced** - Algorithmic paraphrasing
4. **Simple** - Rule-based paraphrasing

This ensures high availability even if individual services fail.