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