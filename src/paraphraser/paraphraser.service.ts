import { Injectable, BadRequestException } from '@nestjs/common';
import {
  ParaphraseRequestDto,
  ParaphraseStyle,
} from './dto/paraphrase-request.dto';
import { ParaphraseResponseDto } from './dto/paraphrase-response.dto';
import { SimpleParaphraseStrategy } from './strategies/simple-paraphrase.strategy';
import { AdvancedParaphraseStrategy } from './strategies/advanced-paraphrase.strategy';
import { AIParaphraseStrategy } from './strategies/ai-paraphrase.strategy';

@Injectable()
export class ParaphraserService {
  constructor(
    private readonly simpleStrategy: SimpleParaphraseStrategy,
    private readonly advancedStrategy: AdvancedParaphraseStrategy,
    private readonly aiStrategy: AIParaphraseStrategy,
  ) {}

  async paraphrase(
    request: ParaphraseRequestDto,
  ): Promise<ParaphraseResponseDto> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(request.text);

      // Choose strategy based on configuration and AI availability
      let strategy;
      const useAI = process.env.USE_AI_PARAPHRASE === 'true';
      const useAdvanced = process.env.USE_ADVANCED_PARAPHRASE === 'true';

      if (useAI) {
        strategy = this.aiStrategy;
      } else if (useAdvanced) {
        strategy = this.advancedStrategy;
      } else {
        strategy = this.simpleStrategy;
      }

      // Perform paraphrasing
      const result = await strategy.paraphrase(
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
      // If AI strategy fails, fallback to simple strategy
      if (error.message.includes('AI paraphrasing service')) {
        const fallbackResult = await this.simpleStrategy.paraphrase(
          request.text,
          request.style || ParaphraseStyle.SIMPLE,
        );

        const processingTime = Date.now() - startTime;

        return {
          originalText: request.text,
          paraphrasedText: fallbackResult.paraphrasedText,
          style: request.style || ParaphraseStyle.SIMPLE,
          confidence: fallbackResult.confidence,
          alternativeVersions: fallbackResult.alternativeVersions || [],
          processingTime,
          wordCount: this.countWords(fallbackResult.paraphrasedText),
          characterCount: fallbackResult.paraphrasedText.length,
        };
      }

      throw new BadRequestException(`Paraphrasing failed: ${error.message}`);
    }
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
}
