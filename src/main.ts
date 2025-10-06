import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn', 'log']
          : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Security
    app.use(helmet());
    app.use(compression());

    // Enable global validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Enable CORS for production
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://*.railway.app',
        'https://*.up.railway.app',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: false,
    });

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Paraphraser API')
      .setDescription(
        `A comprehensive public API for text paraphrasing with multiple styles and advanced features.
      
## Features
- Multiple paraphrasing styles (simple, formal, casual, creative, academic)
- Bulk processing support (up to 10 texts per request)
- Confidence scoring for each paraphrase
- Alternative versions provided
- Rate limiting protection
- Detailed processing metrics

## Usage
1. Use \`POST /paraphrase\` for single text paraphrasing
2. Use \`POST /paraphrase/bulk\` for batch processing
3. Use \`GET /paraphrase/health\` to check service status

## Rate Limits
- Single paraphrase: 100 requests per minute
- Bulk paraphrase: 10 requests per minute

## Supported Languages
Currently supports English (en) with plans for additional languages.`,
      )
      .setVersion('2.0.0')
      .addTag('paraphrase', 'Text paraphrasing endpoints')
      .setContact('API Support', '', 'support@paraphraser-api.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Railway

    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : `http://localhost:${port}`;

    console.log(`🚀 Paraphraser API is running on: ${baseUrl}`);
    console.log(`📖 API Documentation: ${baseUrl}/api-docs`);
    console.log(`🔍 Health Check: ${baseUrl}/paraphrase/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(
      `🤖 Smart Fallback System: Python AI → Cloud AI → Advanced → Simple`,
    );
    console.log(`🐍 Python AI: Available for creative, formal, casual styles`);
    console.log(
      `☁️ Cloud AI: Hugging Face API fallback ${process.env.HUGGINGFACE_API_KEY ? 'configured' : 'not configured'}`,
    );
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
