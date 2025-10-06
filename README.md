# Paraphraser API

A powerful NestJS-based API for text paraphrasing with multiple styles and strategies.

## Features

- 🔄 Multiple paraphrasing styles (Simple, Formal, Casual, Creative, Academic)
- 🚀 High-performance rule-based paraphrasing
- 🤖 Optional AI-powered paraphrasing (OpenAI, HuggingFace)
- 📦 Bulk paraphrasing support
- ✅ Input validation and sanitization
- 🛡️ Security features and rate limiting
- 📊 Processing metrics and confidence scores
- 🌐 CORS support for web applications

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment variables in `.env`:

```env
PORT=3000
USE_ADVANCED_PARAPHRASE=false
OPENAI_API_KEY=your_openai_api_key_here  # Optional
HUGGINGFACE_API_KEY=your_huggingface_api_key_here  # Optional
```

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### POST /paraphrase

Paraphrase a single text.

**Request Body:**

```json
{
  "text": "This is the text you want to paraphrase.",
  "style": "formal",
  "targetLanguage": "en"
}
```

**Response:**

```json
{
  "originalText": "This is the text you want to paraphrase.",
  "paraphrasedText": "This is the content you wish to rephrase.",
  "style": "formal",
  "confidence": 0.85,
  "alternativeVersions": [
    "This is the content you desire to rephrase.",
    "This represents the text you wish to paraphrase."
  ],
  "processingTime": 145,
  "wordCount": 8,
  "characterCount": 42
}
```

### POST /paraphrase/bulk

Paraphrase multiple texts at once (max 10 per request).

**Request Body:**

```json
[
  {
    "text": "First text to paraphrase.",
    "style": "simple"
  },
  {
    "text": "Second text to paraphrase.",
    "style": "formal"
  }
]
```

### GET /paraphrase/styles

Get available paraphrasing styles and their descriptions.

**Response:**

```json
{
  "styles": ["simple", "formal", "casual", "creative", "academic"],
  "descriptions": {
    "simple": "Basic paraphrasing with synonym replacement",
    "formal": "Professional tone with complete sentences",
    "casual": "Conversational style with contractions",
    "creative": "Engaging language with varied structures",
    "academic": "Scholarly tone with precise vocabulary"
  }
}
```

### GET /paraphrase/history

Get paraphrasing history (placeholder endpoint).

### GET /paraphrase/health

Health check endpoint.

## Paraphrasing Styles

| Style      | Description                      | Example                           |
| ---------- | -------------------------------- | --------------------------------- |
| `simple`   | Basic synonym replacement        | "big" → "large"                   |
| `formal`   | Professional, complete sentences | "can't" → "cannot"                |
| `casual`   | Conversational with contractions | "cannot" → "can't"                |
| `creative` | Varied sentence structures       | Restructures sentences creatively |
| `academic` | Scholarly vocabulary             | "show" → "demonstrate"            |

## Configuration

### Environment Variables

| Variable                  | Description            | Default                 |
| ------------------------- | ---------------------- | ----------------------- |
| `PORT`                    | Server port            | `3000`                  |
| `USE_ADVANCED_PARAPHRASE` | Enable AI paraphrasing | `false`                 |
| `OPENAI_API_KEY`          | OpenAI API key         | -                       |
| `HUGGINGFACE_API_KEY`     | HuggingFace API key    | -                       |
| `ALLOWED_ORIGINS`         | CORS allowed origins   | `http://localhost:3000` |

### Paraphrasing Strategies

The API supports two main strategies:

1. **Simple Strategy** (Default): Rule-based paraphrasing using synonym replacement and style transformations
2. **Advanced Strategy**: AI-powered paraphrasing using OpenAI or HuggingFace APIs

## Input Validation

- Text must be between 5 and 5000 characters
- XSS protection against malicious scripts
- Automatic sanitization of input

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Development

### Project Structure

```
src/
├── paraphraser/
│   ├── dto/                    # Data Transfer Objects
│   ├── strategies/             # Paraphrasing strategies
│   ├── paraphraser.controller.ts
│   ├── paraphraser.service.ts
│   └── paraphraser.module.ts
├── app.module.ts
└── main.ts
```

### Adding New Strategies

1. Implement the `ParaphraseStrategy` interface
2. Add the strategy to the `ParaphraserModule` providers
3. Update the `ParaphraserService` to use the new strategy

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Paraphrasing Failed",
  "message": "Text must be at least 5 characters long",
  "statusCode": 400,
  "timestamp": "2025-10-06T12:00:00.000Z"
}
```

## Examples

### Using cURL

```bash
# Simple paraphrasing
curl -X POST http://localhost:3000/paraphrase \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog.",
    "style": "formal"
  }'

# Bulk paraphrasing
curl -X POST http://localhost:3000/paraphrase/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {"text": "Hello world!", "style": "casual"},
    {"text": "Goodbye world!", "style": "formal"}
  ]'
```

### Using JavaScript

```javascript
const response = await fetch('http://localhost:3000/paraphrase', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'This is a test sentence.',
    style: 'creative',
  }),
});

const result = await response.json();
console.log(result.paraphrasedText);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
