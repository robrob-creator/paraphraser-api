import {
  Controller,
  Post,
  Body,
  Get,
  ValidationPipe,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ParaphraserService } from './paraphraser.service';
import { ParaphraseRequestDto } from './dto/paraphrase-request.dto';
import {
  ParaphraseResponseDto,
  ParaphraseErrorDto,
} from './dto/paraphrase-response.dto';
import { Throttle } from '@nestjs/throttler';
import { AIParaphraseService } from './services/ai-paraphrase.service';
import { GrammarCorrectionService } from './services/grammar-correction.service';
import { GrammarCorrectionDto } from './dto/grammar-correction.dto';

@ApiTags('paraphrase')
@Controller('paraphrase')
export class ParaphraserController {
  private readonly logger = new Logger(ParaphraserController.name);

  constructor(
    private readonly paraphraserService: ParaphraserService,
    private readonly aiService: AIParaphraseService,
    private readonly grammarService: GrammarCorrectionService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Check if the paraphraser API service is running and healthy',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
          description: 'Service status',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-10-06T15:30:00.000Z',
          description: 'Current timestamp',
        },
        service: {
          type: 'string',
          example: 'paraphraser-api',
          description: 'Service name',
        },
        version: {
          type: 'string',
          example: '1.0.0',
          description: 'API version',
        },
      },
    },
  })
  async healthCheck() {
    // Get comprehensive health status including Python script availability
    const healthStatus = await this.paraphraserService.getHealthStatus();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'paraphraser-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        platform: process.env.RENDER
          ? 'render'
          : process.env.RAILWAY_PUBLIC_DOMAIN
            ? 'railway'
            : 'local',
        domain: process.env.RENDER
          ? `${process.env.RENDER_SERVICE_NAME}.onrender.com`
          : process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost',
      },
      services: {
        pythonAI: {
          available: healthStatus.pythonAI,
          description: 'T5 Python model for AI paraphrasing',
        },
        cloudAI: {
          available: healthStatus.cloudAI,
          description: 'Hugging Face cloud API for AI paraphrasing',
        },
        advanced: {
          available: healthStatus.advanced,
          description: 'Advanced algorithmic paraphrasing',
        },
        simple: {
          available: healthStatus.simple,
          description: 'Basic rule-based paraphrasing',
        },
      },
      fallbackChain: [
        'Python AI (T5 model)',
        'Cloud AI (Hugging Face)',
        'Advanced algorithmic',
        'Simple rule-based',
      ],
      uptime: process.uptime(),
    };
  }

  @Post()
  @Throttle({ default: { limit: 100, ttl: 86400000 } })
  @ApiOperation({
    summary: 'Paraphrase text',
    description:
      'Transform input text using various paraphrasing styles. Supports multiple languages and provides confidence scores.',
  })
  @ApiBody({
    description: 'Paraphrase request payload',
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to be paraphrased (5-5000 characters)',
          example:
            'Hello world, this is a simple test sentence that needs to be paraphrased.',
        },
        style: {
          type: 'string',
          enum: ['simple', 'formal', 'casual', 'creative', 'academic'],
          description: 'The paraphrasing style to apply',
          example: 'simple',
          default: 'simple',
        },
        targetLanguage: {
          type: 'string',
          description: 'Target language code (ISO 639-1)',
          example: 'en',
          default: 'en',
        },
      },
      required: ['text'],
    },
    examples: {
      simple: {
        summary: 'Simple paraphrasing',
        description: 'Basic paraphrasing with simple style',
        value: {
          text: 'The quick brown fox jumps over the lazy dog.',
          style: 'simple',
        },
      },
      formal: {
        summary: 'Formal paraphrasing',
        description: 'Professional and formal tone',
        value: {
          text: 'I think this is a good idea and we should proceed.',
          style: 'formal',
        },
      },
      creative: {
        summary: 'Creative paraphrasing',
        description: 'More creative and varied language',
        value: {
          text: 'The sun was shining brightly in the clear blue sky.',
          style: 'creative',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Text paraphrased successfully',
    schema: {
      type: 'object',
      properties: {
        originalText: {
          type: 'string',
          example: 'Hello world, this is a simple test sentence.',
        },
        paraphrasedText: {
          type: 'string',
          example:
            'Greetings everyone, this represents a basic example phrase.',
        },
        style: {
          type: 'string',
          example: 'simple',
        },
        confidence: {
          type: 'number',
          format: 'float',
          example: 0.85,
          description: 'Confidence score between 0 and 1',
        },
        alternativeVersions: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'Hi there, this is a basic test statement.',
            'Hello everyone, this is a straightforward example sentence.',
          ],
        },
        processingTime: {
          type: 'number',
          example: 1250,
          description: 'Processing time in milliseconds',
        },
        wordCount: {
          type: 'number',
          example: 8,
        },
        characterCount: {
          type: 'number',
          example: 52,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Paraphrasing Failed' },
        message: {
          type: 'string',
          example: 'Text must be at least 5 characters long',
        },
        statusCode: { type: 'number', example: 400 },
        timestamp: { type: 'string', example: '2025-10-06T15:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        statusCode: { type: 'number', example: 429 },
      },
    },
  })
  async paraphrase(
    @Body(ValidationPipe) request: ParaphraseRequestDto,
  ): Promise<ParaphraseResponseDto> {
    try {
      return await this.paraphraserService.paraphrase(request);
    } catch (error) {
      throw new HttpException(
        {
          error: 'Paraphrasing Failed',
          message: error.message,
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
        } as ParaphraseErrorDto,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('grammar-check')
  @Throttle({ default: { limit: 100, ttl: 86400000 } })
  @ApiOperation({
    summary: 'Correct grammar in text',
    description:
      'Detect and correct grammatical errors in the provided text. Supports basic and advanced correction levels.',
  })
  @ApiBody({
    description: 'Text to be grammar checked',
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to correct grammar for',
          example:
            'me and my friend was going to the store but we couldnt find it nowhere',
        },
        level: {
          type: 'string',
          enum: ['basic', 'advanced'],
          description: 'Correction level - basic uses rules, advanced uses AI',
          example: 'basic',
          default: 'basic',
        },
      },
      required: ['text'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Grammar corrected successfully',
    schema: {
      type: 'object',
      properties: {
        originalText: {
          type: 'string',
          example: 'me and my friend was going to the store',
        },
        correctedText: {
          type: 'string',
          example: 'My friend and I were going to the store',
        },
        corrections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original: { type: 'string' },
              corrected: { type: 'string' },
              type: { type: 'string' },
              confidence: { type: 'number' },
            },
          },
        },
        confidence: {
          type: 'number',
          format: 'float',
          example: 0.9,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    type: ParaphraseErrorDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ParaphraseErrorDto,
  })
  async correctGrammar(
    @Body(ValidationPipe) grammarDto: GrammarCorrectionDto,
  ): Promise<{
    originalText: string;
    correctedText: string;
    corrections: Array<{
      original: string;
      corrected: string;
      type: string;
      confidence: number;
    }>;
    confidence: number;
  }> {
    try {
      this.logger.log(`Grammar correction request: ${grammarDto.text}`);

      const result = await this.grammarService.correctGrammar(
        grammarDto.text,
        grammarDto.level || 'basic',
      );

      this.logger.log(`Grammar correction completed for: ${grammarDto.text}`);
      return result;
    } catch (error) {
      this.logger.error(`Grammar correction failed: ${error.message}`);
      throw new HttpException(
        {
          message: 'Grammar correction failed',
          error: error.message,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk')
  @Throttle({ default: { limit: 100, ttl: 86400000 } })
  @ApiOperation({
    summary: 'Bulk paraphrase texts',
    description:
      'Paraphrase multiple texts in a single request. Maximum 10 requests per operation. Ideal for batch processing.',
  })
  @ApiBody({
    description: 'Array of paraphrase requests',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to be paraphrased (5-5000 characters)',
            example: 'This is a sample sentence to paraphrase.',
          },
          style: {
            type: 'string',
            enum: ['simple', 'formal', 'casual', 'creative', 'academic'],
            description: 'The paraphrasing style to apply',
            example: 'simple',
            default: 'simple',
          },
          targetLanguage: {
            type: 'string',
            description: 'Target language code (ISO 639-1)',
            example: 'en',
            default: 'en',
          },
        },
        required: ['text'],
      },
      maxItems: 10,
      minItems: 1,
    },
    examples: {
      mixed_styles: {
        summary: 'Mixed paraphrasing styles',
        description: 'Example with different styles for each text',
        value: [
          {
            text: 'The weather is nice today.',
            style: 'simple',
          },
          {
            text: 'We need to schedule a meeting to discuss the project.',
            style: 'formal',
          },
          {
            text: 'That movie was absolutely amazing!',
            style: 'casual',
          },
        ],
      },
      batch_processing: {
        summary: 'Batch processing example',
        description: 'Multiple texts with same style',
        value: [
          {
            text: 'Artificial intelligence is transforming industries.',
            style: 'academic',
          },
          {
            text: 'Machine learning algorithms require large datasets.',
            style: 'academic',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Texts paraphrased successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalText: {
            type: 'string',
            example: 'The weather is nice today.',
          },
          paraphrasedText: {
            type: 'string',
            example: "Today's weather conditions are pleasant.",
          },
          style: {
            type: 'string',
            example: 'simple',
          },
          confidence: {
            type: 'number',
            format: 'float',
            example: 0.87,
          },
          alternativeVersions: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'The climate is good today.',
              "It's a beautiful day weather-wise.",
            ],
          },
          processingTime: {
            type: 'number',
            example: 980,
          },
          wordCount: {
            type: 'number',
            example: 6,
          },
          characterCount: {
            type: 'number',
            example: 35,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Bulk Paraphrasing Failed' },
        message: {
          type: 'string',
          example: 'Maximum 10 requests allowed per bulk operation',
        },
        statusCode: { type: 'number', example: 400 },
        timestamp: { type: 'string', example: '2025-10-06T15:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
        statusCode: { type: 'number', example: 429 },
      },
    },
  })
  async bulkParaphrase(
    @Body(ValidationPipe) requests: ParaphraseRequestDto[],
  ): Promise<ParaphraseResponseDto[]> {
    try {
      if (!Array.isArray(requests) || requests.length === 0) {
        throw new HttpException(
          'Invalid request: expected array of paraphrase requests',
          HttpStatus.BAD_REQUEST,
        );
      }

      const maxRequests = 10;
      if (requests.length > maxRequests) {
        throw new HttpException(
          `Maximum ${maxRequests} requests allowed per bulk operation`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.paraphraserService.bulkParaphrase(requests);
    } catch (error) {
      throw new HttpException(
        {
          error: 'Bulk Paraphrasing Failed',
          message: error.message,
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
        } as ParaphraseErrorDto,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
