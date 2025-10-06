# 🚀 Deployment Checklist

## Pre-Deployment Verification

### ✅ Local Testing

```bash
# 1. Test Python script directly
npm run python:test

# 2. Test full application
npm run build
npm run start:prod

# 3. Test Python AI integration
curl -X POST http://localhost:3000/paraphrase \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world, this is a test.", "style": "creative"}'

# 4. Check health status
curl http://localhost:3000/paraphrase/health
```

### ✅ Render.com Deployment Steps

1. **Connect Repository**
   - Link GitHub repository to Render
   - Render auto-detects `render.yaml`

2. **Set Environment Variables**
   - `HUGGINGFACE_API_KEY`: Get from [Hugging Face](https://huggingface.co/settings/tokens)
   - All other vars are set in `render.yaml`

3. **Monitor Deployment**
   - Check build logs for Python dependency installation
   - Verify T5 model download (~892MB)
   - Confirm health check passes

4. **Test Deployment**

   ```bash
   # Health check
   curl https://your-app.onrender.com/paraphrase/health

   # Test Python AI
   curl -X POST https://your-app.onrender.com/paraphrase \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello world!", "style": "creative"}'
   ```

## 🔧 Troubleshooting

### Common Render Deployment Issues

#### 1. "ModuleNotFoundError: No module named 'transformers'"

```bash
# Check build logs for pip installation
# Try redeploying if pip install failed
# Verify requirements.txt is in root directory
```

#### 2. "Hugging Face API key not configured"

```bash
# Go to Render Dashboard → Environment Variables
# Add: HUGGINGFACE_API_KEY = your_token_here
# Get token from: https://huggingface.co/settings/tokens
```

#### 3. "Python AI confidence too low: 0.1"

```bash
# This means Python script failed but didn't crash
# Check if Python dependencies are properly installed
# Verify T5 model can be downloaded (~892MB)
```

### Expected Log Sequence for Working Deployment:

```
✅ [ParaphraserService] Executing fallback for style: creative
✅ [ParaphraserService] Use AI: true
✅ [ParaphraserService] Attempting Python AI paraphrasing...
✅ [ParaphraserService] Python AI paraphrasing successful
```

### Python Issues

- Check build logs for `pip install` errors
- Verify Python 3 is available on Render
- Monitor memory usage (T5 model needs ~1GB)

### Fallback Testing

- `creative`, `formal`, `casual` → Should use Python AI
- `simple`, `academic` → Should use Advanced/Simple
- If Python fails → Should fallback to Cloud AI → Advanced → Simple

### Performance

- First request may be slow (model loading)
- Subsequent requests should be faster
- Monitor response times and error rates

## 📊 Expected Behavior

✅ **Python AI Working**: Logs show "Python AI paraphrasing successful"  
✅ **Fallback Working**: Graceful degradation when services fail  
✅ **Health Check**: Shows status of all 4 services  
✅ **Different Outputs**: Creative style produces varied paraphrases
