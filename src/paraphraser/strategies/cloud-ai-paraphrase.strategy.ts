import { Injectable } from '@nestjs/common';
import { ParaphraseStrategy } from './paraphrase-strategy.interface';
import { CloudAIParaphraseService } from '../services/cloud-ai-paraphrase.service';

@Injectable()
export class CloudAIParaphraseStrategy implements ParaphraseStrategy {
  constructor(private cloudAIService: CloudAIParaphraseService) {}

  async paraphrase(
    text: string,
    style: string,
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions: string[];
  }> {
    return this.cloudAIService.paraphrase(text, style);
  }
}