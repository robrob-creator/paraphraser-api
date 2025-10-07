import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudAIParaphraseService {
  private readonly logger = new Logger(CloudAIParaphraseService.name);

  constructor(private configService: ConfigService) {}

  async paraphrase(
    text: string,
    style: string = 'simple',
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions: string[];
  }> {
    try {
      const hfApiKey = this.configService.get('HUGGINGFACE_API_KEY');

      if (!hfApiKey) {
        throw new Error('Hugging Face API key not configured');
      }

      // Use the T5 model via Hugging Face Inference API
      const response = await fetch(
        'https://api-inference.huggingface.co/models/Vamsi/T5_Paraphrase_Paws',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hfApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: `paraphrase: ${text}`,
            parameters: {
              max_new_tokens: 100,
              num_return_sequences: 3,
              temperature: this.getTemperatureForStyle(style),
              do_sample: true,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Hugging Face API error: ${response.status} - ${errorText}`,
        );
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      const results = await response.json();

      // Handle different response formats
      if (Array.isArray(results) && results.length > 0) {
        const mainResult = results[0]?.generated_text || text;
        const alternatives = results
          .slice(1)
          .map((r) => r.generated_text)
          .filter(Boolean);

        return {
          paraphrasedText: this.cleanGeneratedText(mainResult, text),
          confidence: 0.9,
          alternativeVersions: alternatives.map((alt) =>
            this.cleanGeneratedText(alt, text),
          ),
        };
      } else if (results.generated_text) {
        return {
          paraphrasedText: this.cleanGeneratedText(
            results.generated_text,
            text,
          ),
          confidence: 0.9,
          alternativeVersions: [],
        };
      } else {
        throw new Error('Unexpected response format from Hugging Face API');
      }
    } catch (error) {
      this.logger.error(`Cloud AI paraphrasing failed: ${error.message}`);
      throw new Error('AI paraphrasing service temporarily unavailable');
    }
  }

  private getTemperatureForStyle(style: string): number {
    const temperatures = {
      simple: 0.3,
      formal: 0.2,
      casual: 0.5,
      creative: 0.8,
      academic: 0.2,
    };
    return temperatures[style] || 0.3;
  }

  private cleanGeneratedText(generated: string, original: string): string {
    // Remove common prefixes that the model might add
    const cleaned = generated
      .replace(/^paraphrase:\s*/i, '')
      .replace(/^paraphrased:\s*/i, '')
      .replace(/^result:\s*/i, '')
      .trim();

    // If the result is too similar to input or empty, return original
    if (!cleaned || cleaned.toLowerCase() === original.toLowerCase()) {
      return original;
    }

    return cleaned;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const hfApiKey = this.configService.get('HUGGINGFACE_API_KEY');
      return !!hfApiKey;
    } catch {
      return false;
    }
  }
}
