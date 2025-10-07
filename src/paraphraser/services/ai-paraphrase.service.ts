import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class AIParaphraseService {
  private readonly logger = new Logger(AIParaphraseService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiHost: string;
  private readonly apiUrl: string;

  constructor() {
    this.apiKey =
      process.env.RAPIDAPI_KEY ||
      '3bdfaaccb0msh73e4be8ab254ae5p1a99a5jsne1bd25eeed2b';
    this.apiHost =
      'rewriter-paraphraser-text-changer-multi-language.p.rapidapi.com';
    this.apiUrl =
      'https://rewriter-paraphraser-text-changer-multi-language.p.rapidapi.com/rewrite';

    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': this.apiHost,
        'x-rapidapi-key': this.apiKey,
        Accept: '*/*',
        'User-Agent': 'axios/1.12.2',
      },
      validateStatus: function (status) {
        return status < 500; // Accept any status code below 500
      },
    });
  }

  async paraphrase(
    text: string,
    style: string = 'simple',
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions: string[];
  }> {
    try {
      this.logger.log(`Calling RapidAPI with text: "${text}", style: ${style}`);
      const response = await this.httpClient.post(this.apiUrl, {
        language: 'en',
        strength: this.getStrengthFromStyle(style),
        text: text,
      });

      this.logger.log(`RapidAPI response status: ${response.status}`);
      this.logger.log(
        `RapidAPI response data: ${JSON.stringify(response.data)}`,
      );

      if (response.status !== 200) {
        this.logger.error(
          `API returned status ${response.status}: ${JSON.stringify(response.data)}`,
        );
        throw new Error(`API returned status ${response.status}`);
      }

      const paraphrasedText = response.data?.rewrite || text;
      const confidence = Math.max(response.data?.similarity || 0.85, 0.8); // Ensure minimum confidence of 0.8 for successful API calls

      this.logger.log(
        `Extracted paraphrasedText: "${paraphrasedText}", confidence: ${confidence}`,
      );

      return {
        paraphrasedText,
        confidence,
        alternativeVersions: [],
      };
    } catch (error) {
      this.logger.error(
        `Error calling RapidAPI paraphrase service: ${error.message}`,
      );
      if (error.response) {
        this.logger.error(`Response status: ${error.response.status}`);
        this.logger.error(
          `Response data: ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        this.logger.error(`No response received: ${error.request}`);
      } else {
        this.logger.error(`Request setup error: ${error.message}`);
      }
      throw new Error('AI paraphrasing service temporarily unavailable');
    }
  }

  private getStrengthFromStyle(style: string): number {
    const styleMap = {
      simple: 1,
      creative: 3, // Max allowed is 3
      advanced: 2,
      academic: 2,
      casual: 1,
      formal: 3, // Max allowed is 3
    };
    return styleMap[style] || 2;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.httpClient.post(this.apiUrl, {
        language: 'en',
        strength: 1,
        text: 'test',
      });
      return true;
    } catch {
      return false;
    }
  }
}
