# Paraphraser API - Usage Examples

## Base URLs

### Production (Railway)

```
https://web-production-61c7.up.railway.app
```

### Local Development

```
http://localhost:3000
```

## Health Check

### Production

```bash
curl -X GET https://web-production-61c7.up.railway.app/paraphrase/health
```

### Local

```bash
curl -X GET http://localhost:3000/paraphrase/health
```

## Single Text Paraphrasing

### Simple Style (Production)

```bash
curl -X POST https://web-production-61c7.up.railway.app/paraphrase \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog.",
    "style": "simple"
  }'
```

### Simple Style (Local)

```bash
curl -X POST http://localhost:3000/paraphrase \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog.",
    "style": "simple"
  }'
```

### Formal Style (Production)

```bash
curl -X POST https://web-production-61c7.up.railway.app/paraphrase \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I think this is a good idea and we should proceed.",
    "style": "formal"
  }'
```

### Creative Style

```bash
curl -X POST http://localhost:3000/paraphrase \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The sun was shining brightly in the clear blue sky.",
    "style": "creative"
  }'
```

### Academic Style

```bash
curl -X POST http://localhost:3000/paraphrase \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Research indicates that climate change affects global weather patterns.",
    "style": "academic"
  }'
```

### Casual Style

```bash
curl -X POST http://localhost:3000/paraphrase \
  -H "Content-Type: application/json" \
  -d '{
    "text": "That movie was absolutely amazing!",
    "style": "casual"
  }'
```

## Bulk Text Paraphrasing

### Mixed Styles (Production)

```bash
curl -X POST https://web-production-61c7.up.railway.app/paraphrase/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "text": "The weather is nice today.",
      "style": "simple"
    },
    {
      "text": "We need to schedule a meeting to discuss the project.",
      "style": "formal"
    },
    {
      "text": "That movie was absolutely amazing!",
      "style": "casual"
    }
  ]'
```

### Mixed Styles (Local)

```bash
curl -X POST http://localhost:3000/paraphrase/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "text": "The weather is nice today.",
      "style": "simple"
    },
    {
      "text": "We need to schedule a meeting to discuss the project.",
      "style": "formal"
    },
    {
      "text": "That movie was absolutely amazing!",
      "style": "casual"
    }
  ]'
```

### Batch Processing (Same Style)

```bash
curl -X POST http://localhost:3000/paraphrase/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "text": "Artificial intelligence is transforming industries.",
      "style": "academic"
    },
    {
      "text": "Machine learning algorithms require large datasets.",
      "style": "academic"
    }
  ]'
```

## Response Format

### Single Paraphrase Response

```json
{
  "originalText": "The quick brown fox jumps over the lazy dog.",
  "paraphrasedText": "A swift auburn fox leaps across the idle canine.",
  "style": "simple",
  "confidence": 0.85,
  "alternativeVersions": [
    "The fast brown fox hops over the sleepy dog.",
    "A rapid brown fox bounds over the resting dog."
  ],
  "processingTime": 1250,
  "wordCount": 9,
  "characterCount": 42
}
```

### Bulk Paraphrase Response

```json
[
  {
    "originalText": "The weather is nice today.",
    "paraphrasedText": "Today's weather conditions are pleasant.",
    "style": "simple",
    "confidence": 0.87,
    "alternativeVersions": [
      "The climate is good today.",
      "It's a beautiful day weather-wise."
    ],
    "processingTime": 980,
    "wordCount": 6,
    "characterCount": 35
  },
  {
    "originalText": "We need to schedule a meeting.",
    "paraphrasedText": "It is necessary to arrange a conference.",
    "style": "formal",
    "confidence": 0.92,
    "alternativeVersions": [
      "We must organize a meeting.",
      "A meeting should be scheduled."
    ],
    "processingTime": 1100,
    "wordCount": 7,
    "characterCount": 39
  }
]
```

## Error Responses

### Validation Error

```json
{
  "error": "Paraphrasing Failed",
  "message": "Text must be at least 5 characters long",
  "statusCode": 400,
  "timestamp": "2025-10-06T15:30:00.000Z"
}
```

### Rate Limit Error

```json
{
  "message": "ThrottlerException: Too Many Requests",
  "statusCode": 429
}
```

## Available Styles

- `simple` - Basic paraphrasing with simple vocabulary
- `formal` - Professional and business-appropriate language
- `casual` - Informal and conversational tone
- `creative` - More varied and artistic language choices
- `academic` - Scholarly and research-oriented style

## Limits

- Text length: 5-5000 characters
- Bulk requests: Maximum 10 texts per request
- Rate limits: 100 req/min for single, 10 req/min for bulk

## API Documentation

### Production

Visit https://web-production-61c7.up.railway.app/api-docs for interactive Swagger documentation.

### Local

Visit http://localhost:3000/api-docs for interactive Swagger documentation.

## Live Production Testing

You can test the live API directly:

### Quick Test (Production)

```bash
curl -X POST https://web-production-61c7.up.railway.app/paraphrase \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world! This is a test of the paraphraser API.", "style": "simple"}'
```

### Health Check (Production)

```bash
curl -X GET https://web-production-61c7.up.railway.app/paraphrase/health
```

### AI Paraphrasing Test (Production)

```bash
curl -X POST https://web-production-61c7.up.railway.app/paraphrase \
  -H "Content-Type: application/json" \
  -d '{"text": "Artificial intelligence is transforming the way we work and live.", "style": "academic"}'
```
