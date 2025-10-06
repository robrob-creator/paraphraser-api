import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  ParaphraseRequestDto,
  ParaphraseStyle,
} from './dto/paraphrase-request.dto';
import { ParaphraseResponseDto } from './dto/paraphrase-response.dto';
import { SimpleParaphraseStrategy } from './strategies/simple-paraphrase.strategy';
import { AdvancedParaphraseStrategy } from './strategies/advanced-paraphrase.strategy';
import { AIParaphraseStrategy } from './strategies/ai-paraphrase.strategy';
import { CloudAIParaphraseStrategy } from './strategies/cloud-ai-paraphrase.strategy';

@Injectable()
export class ParaphraserService {
  private readonly logger = new Logger(ParaphraserService.name);

  constructor(
    private readonly simpleStrategy: SimpleParaphraseStrategy,
    private readonly advancedStrategy: AdvancedParaphraseStrategy,
    private readonly aiStrategy: AIParaphraseStrategy,
    private readonly cloudAIStrategy: CloudAIParaphraseStrategy,
  ) {}

  async paraphrase(
    request: ParaphraseRequestDto,
  ): Promise<ParaphraseResponseDto> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(request.text);

      // Smart fallback system: Python AI → Cloud AI → Advanced → Simple
      const result = await this.executeWithFallback(
        request.text,
        request.style || ParaphraseStyle.SIMPLE,
        request.targetLanguage,
      );

      const processingTime = Date.now() - startTime;

      const response: ParaphraseResponseDto = {
        originalText: request.text,
        paraphrasedText: result.paraphrasedText,
        style: request.style || ParaphraseStyle.SIMPLE,
        confidence: result.confidence,
        alternativeVersions: result.alternativeVersions || [],
        processingTime,
        wordCount: this.countWords(result.paraphrasedText),
        characterCount: result.paraphrasedText.length,
      };

      return response;
    } catch (error) {
      this.logger.error(`Paraphrasing failed: ${error.message}`);
      throw new BadRequestException(`Paraphrasing failed: ${error.message}`);
    }
  }

  private async executeWithFallback(
    text: string,
    style: ParaphraseStyle,
    targetLanguage?: string,
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions?: string[];
  }> {
    // For creative styles, try AI approaches first
    const aiStyles = [
      ParaphraseStyle.CREATIVE,
      ParaphraseStyle.FORMAL,
      ParaphraseStyle.CASUAL,
    ];
    const useAI = aiStyles.includes(style);

    this.logger.log(`Executing fallback for style: ${style}`);
    this.logger.log(`AI styles: ${aiStyles.join(', ')}`);
    this.logger.log(`Use AI: ${useAI}`);

    if (useAI) {
      // Try Python AI first (T5 model)
      try {
        this.logger.log('Attempting Python AI paraphrasing...');
        this.logger.debug(`Python executable path: ${this.aiStrategy}`);
        const result = await this.aiStrategy.paraphrase(
          text,
          style,
          targetLanguage,
        );
        this.logger.debug(`Python AI result: ${JSON.stringify(result)}`);
        if (result.confidence > 0.5) {
          this.logger.log('Python AI paraphrasing successful');
          return result;
        } else {
          this.logger.warn(
            `Python AI confidence too low: ${result.confidence}`,
          );
        }
      } catch (error) {
        this.logger.error(`Python AI failed: ${error.message}`);
        this.logger.debug(`Python AI error stack: ${error.stack}`);
      }

      // Skip Cloud AI - go directly to Advanced for faster fallback
      this.logger.log(
        'Skipping Cloud AI - proceeding to Advanced paraphrasing',
      );
    }

    // Fallback to Advanced strategy
    try {
      this.logger.log('Attempting Advanced paraphrasing...');
      const result = await this.advancedStrategy.paraphrase(
        text,
        style,
        targetLanguage,
      );
      if (result.confidence > 0.3) {
        this.logger.log('Advanced paraphrasing successful');
        return result;
      }
    } catch (error) {
      this.logger.warn(`Advanced strategy failed: ${error.message}`);
    }

    // Final fallback to Simple strategy
    this.logger.log('Using Simple paraphrasing as final fallback');
    return await this.simpleStrategy.paraphrase(text, style);
  }

  async bulkParaphrase(
    requests: ParaphraseRequestDto[],
  ): Promise<ParaphraseResponseDto[]> {
    const results: ParaphraseResponseDto[] = [];

    for (const request of requests) {
      try {
        const result = await this.paraphrase(request);
        results.push(result);
      } catch {
        // Continue with other requests even if one fails
        results.push({
          originalText: request.text,
          paraphrasedText: '',
          style: request.style || ParaphraseStyle.SIMPLE,
          confidence: 0,
          alternativeVersions: [],
          processingTime: 0,
          wordCount: 0,
          characterCount: 0,
        });
      }
    }

    return results;
  }

  private validateInput(text: string): void {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text cannot be empty');
    }

    if (text.length > 5000) {
      throw new BadRequestException('Text cannot exceed 5000 characters');
    }

    if (text.length < 5) {
      throw new BadRequestException('Text must be at least 5 characters long');
    }

    // Check for potentially harmful content
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        throw new BadRequestException(
          'Text contains potentially harmful content',
        );
      }
    }
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  async getHealthStatus(): Promise<{
    pythonAI: boolean;
    cloudAI: boolean;
    advanced: boolean;
    simple: boolean;
  }> {
    const [pythonAI, cloudAI] = await Promise.allSettled([
      this.checkPythonAI(),
      this.checkCloudAI(),
    ]);

    return {
      pythonAI: pythonAI.status === 'fulfilled' && pythonAI.value,
      cloudAI: cloudAI.status === 'fulfilled' && cloudAI.value,
      advanced: true, // Always available
      simple: true, // Always available
    };
  }

  private async checkPythonAI(): Promise<boolean> {
    try {
      // Check if AI service is available by calling the isAvailable method
      const aiServiceModule = await import('./services/ai-paraphrase.service');
      const aiService = new aiServiceModule.AIParaphraseService();
      return await aiService.isAvailable();
    } catch {
      return false;
    }
  }

  private async checkCloudAI(): Promise<boolean> {
    try {
      // Test cloud AI with a simple request
      const result = await this.cloudAIStrategy.paraphrase('test', 'simple');
      return result.paraphrasedText.length > 0;
    } catch {
      return false;
    }
  }
}
