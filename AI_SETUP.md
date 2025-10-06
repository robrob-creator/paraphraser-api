# AI Paraphrasing Integration Setup

## 🚀 Quick Setup

1. **Run the setup script:**

   ```bash
   ./setup-ai.sh
   ```

2. **Enable AI paraphrasing:**

   ```bash
   # Add to your .env file
   USE_AI_PARAPHRASE=true
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## 📋 Manual Setup

### 1. Install Python Dependencies

```bash
cd scripts
pip3 install -r requirements.txt
```

### 2. Test the AI Model

```bash
python3 scripts/paraphrase_model.py "Hello world" simple 2
```

### 3. Environment Configuration

Create or update your `.env` file:

```env
# AI Paraphrasing (requires Python setup)
USE_AI_PARAPHRASE=true

# Fallback to advanced paraphrasing if AI fails
USE_ADVANCED_PARAPHRASE=true

# Server settings
PORT=3000
```

## 🔧 Configuration Options

### Environment Variables

- `USE_AI_PARAPHRASE=true` - Enable AI-powered paraphrasing
- `USE_ADVANCED_PARAPHRASE=true` - Use advanced strategy as fallback
- `PORT=3000` - Server port

### Strategy Selection Logic

1. **AI Strategy** (if `USE_AI_PARAPHRASE=true` and Python deps available)
2. **Advanced Strategy** (if `USE_ADVANCED_PARAPHRASE=true`)
3. **Simple Strategy** (default fallback)

## 📊 Health Check

Check service status and AI availability:

```bash
curl http://localhost:3000/paraphrase/health
```

Response includes:

```json
{
  "status": "ok",
  "timestamp": "2025-10-06T15:30:00.000Z",
  "service": "paraphraser-api",
  "version": "1.0.0",
  "features": {
    "aiParaphrasing": true,
    "useAI": true,
    "useAdvanced": true
  }
}
```

## 🧪 Testing AI Integration

### Test AI Paraphrasing

```bash
curl -X POST http://localhost:3000/paraphrase \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog.",
    "style": "formal"
  }'
```

### Expected AI Response

```json
{
  "originalText": "The quick brown fox jumps over the lazy dog.",
  "paraphrasedText": "A swift brown fox leaps across a lethargic canine.",
  "style": "formal",
  "confidence": 0.9,
  "alternativeVersions": [
    "The rapid brown fox bounds over the idle dog.",
    "A fast brown fox hops across the sleepy canine."
  ],
  "processingTime": 2500,
  "wordCount": 9,
  "characterCount": 42
}
```

## ⚠️ Troubleshooting

### Common Issues

1. **Python dependencies not found:**

   ```bash
   pip3 install torch transformers
   ```

2. **Model download takes time:**
   - First run downloads ~500MB T5 model
   - Subsequent runs use cached model

3. **Memory issues:**
   - T5 model requires ~2GB RAM
   - Consider using CPU-only version for small servers

4. **AI service timeout:**
   - Default timeout: 30 seconds
   - Model loading can take 10-30 seconds on first run

### Performance Tips

1. **Keep server running** - Model stays loaded in memory
2. **Use GPU if available** - Significantly faster processing
3. **Monitor memory usage** - T5 model is memory-intensive

## 🔄 Fallback Behavior

The API automatically falls back to simpler strategies if AI fails:

1. **AI Strategy fails** → **Advanced Strategy**
2. **Advanced Strategy fails** → **Simple Strategy**
3. **All strategies fail** → **Error response**

This ensures the API remains available even if the AI service is down.

## 📈 Performance Comparison

| Strategy | Quality    | Speed      | Memory     | Accuracy   |
| -------- | ---------- | ---------- | ---------- | ---------- |
| AI (T5)  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐       | ⭐⭐⭐⭐⭐ |
| Advanced | ⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     |
| Simple   | ⭐⭐       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐       |
