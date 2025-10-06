/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { ParaphraseStrategy } from './paraphrase-strategy.interface';
import { ParaphraseStyle } from '../dto/paraphrase-request.dto';
import { AIParaphraseService } from '../services/ai-paraphrase.service';

@Injectable()
export class AIParaphraseStrategy implements ParaphraseStrategy {
  constructor(private readonly aiService: AIParaphraseService) {}

  async paraphrase(
    text: string,
    style: ParaphraseStyle,
    targetLanguage?: string,
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions?: string[];
  }> {
    try {
      return await this.aiService.paraphrase(text, style);
    } catch (error) {
      // Fallback: return original text with low confidence if AI service fails
      return {
        paraphrasedText: text,
        confidence: 0.1,
        alternativeVersions: [],
      };
    }
  }
}
