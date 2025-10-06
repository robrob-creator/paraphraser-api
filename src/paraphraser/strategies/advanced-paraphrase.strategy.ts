/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ParaphraseStrategy } from './paraphrase-strategy.interface';
import axios from 'axios';

@Injectable()
export class AdvancedParaphraseStrategy implements ParaphraseStrategy {
  private readonly openAIApiKey: string;
  private readonly huggingFaceApiKey: string;

  constructor() {
    // In a real app, these would come from environment variables
    this.openAIApiKey = process.env.OPENAI_API_KEY || '';
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  async paraphrase(
    text: string,
    style: string,
    targetLanguage: string = 'en',
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions?: string[];
  }> {
    try {
      // Try OpenAI first if API key is available
      if (this.openAIApiKey) {
        return await this.paraphraseWithOpenAI(text, style, targetLanguage);
      }

      // Fallback to HuggingFace if available
      if (this.huggingFaceApiKey) {
        return await this.paraphraseWithHuggingFace(text, style);
      }

      // Fallback to rule-based approach
      return await this.paraphraseWithRules(text, style);
    } catch (error) {
      console.error('Advanced paraphrasing failed:', error);
      // Fallback to rule-based approach
      return await this.paraphraseWithRules(text, style);
    }
  }

  private async paraphraseWithOpenAI(
    text: string,
    style: string,
    targetLanguage: string,
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions?: string[];
  }> {
    const prompt = this.createOpenAIPrompt(text, style, targetLanguage);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional paraphrasing assistant.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openAIApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const paraphrasedText = response.data.choices[0].message.content.trim();

      // Generate alternatives
      const alternatives = await this.generateOpenAIAlternatives(
        text,
        style,
        targetLanguage,
      );

      return {
        paraphrasedText,
        confidence: 0.9,
        alternativeVersions: alternatives,
      };
    } catch (error) {
      throw new HttpException(
        'OpenAI API request failed',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async paraphraseWithHuggingFace(
    text: string,
    style: string,
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions?: string[];
  }> {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/tuner007/pegasus_paraphrase',
        {
          inputs: text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.huggingFaceApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      let paraphrasedText = response.data[0]?.generated_text || text;
      paraphrasedText = this.applyStyleToText(paraphrasedText, style);

      return {
        paraphrasedText,
        confidence: 0.8,
        alternativeVersions: [],
      };
    } catch (error) {
      throw new HttpException(
        'HuggingFace API request failed',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async paraphraseWithRules(
    text: string,
    style: string,
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions?: string[];
  }> {
    // Advanced rule-based paraphrasing
    let paraphrasedText = text;

    // Sentence restructuring patterns
    paraphrasedText = this.restructureSentences(paraphrasedText);

    // Apply style transformations
    paraphrasedText = this.applyStyleToText(paraphrasedText, style);

    // Apply advanced transformations
    paraphrasedText = this.applyAdvancedTransformations(paraphrasedText);

    return {
      paraphrasedText,
      confidence: 0.6,
      alternativeVersions: [],
    };
  }

  private createOpenAIPrompt(
    text: string,
    style: string,
    targetLanguage: string,
  ): string {
    const styleInstructions = {
      formal: 'Use formal language, complete sentences, and professional tone.',
      casual: 'Use casual, conversational language with contractions.',
      creative:
        'Use creative and engaging language with varied sentence structures.',
      academic:
        'Use academic tone with scholarly vocabulary and precise language.',
      simple: 'Use simple, clear language that is easy to understand.',
    };

    return `Please paraphrase the following text in ${targetLanguage} using a ${style} style. ${styleInstructions[style] || ''} Maintain the original meaning while changing the wording and structure:

"${text}"

Provide only the paraphrased version without any additional explanation.`;
  }

  private async generateOpenAIAlternatives(
    text: string,
    style: string,
    targetLanguage: string,
  ): Promise<string[]> {
    const alternatives: string[] = [];

    try {
      for (let i = 0; i < 2; i++) {
        const prompt = `${this.createOpenAIPrompt(text, style, targetLanguage)} 
        
Please provide a different paraphrased version than previous attempts.`;

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 300,
            temperature: 0.8,
          },
          {
            headers: {
              Authorization: `Bearer ${this.openAIApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const alternative = response.data.choices[0].message.content.trim();
        if (alternative && alternative !== text) {
          alternatives.push(alternative);
        }
      }
    } catch (error) {
      console.error('Failed to generate alternatives:', error);
    }

    return alternatives;
  }

  private restructureSentences(text: string): string {
    // Transform passive to active voice and vice versa
    let result = text;

    // Passive to active transformations
    result = result.replace(/(\w+)\s+was\s+(\w+ed)\s+by\s+(\w+)/g, '$3 $2 $1');

    // Change sentence beginnings
    result = result.replace(/^However,/, 'Nevertheless,');
    result = result.replace(/^Therefore,/, 'Consequently,');
    result = result.replace(/^Moreover,/, 'Furthermore,');

    return result;
  }

  private applyStyleToText(text: string, style: string): string {
    switch (style) {
      case 'formal':
        return text
          .replace(/\bcan't\b/g, 'cannot')
          .replace(/\bwon't\b/g, 'will not')
          .replace(/\bdon't\b/g, 'do not')
          .replace(/\bit's\b/g, 'it is')
          .replace(/\bthat's\b/g, 'that is');

      case 'casual':
        return text
          .replace(/\bcannot\b/g, "can't")
          .replace(/\bwill not\b/g, "won't")
          .replace(/\bdo not\b/g, "don't")
          .replace(/\bit is\b/g, "it's")
          .replace(/\bthat is\b/g, "that's");

      case 'academic':
        return text
          .replace(/\bshow\b/g, 'demonstrate')
          .replace(/\bget\b/g, 'obtain')
          .replace(/\buse\b/g, 'utilize')
          .replace(/\bhelp\b/g, 'facilitate');

      default:
        return text;
    }
  }

  private applyAdvancedTransformations(text: string): string {
    let result = text;

    // Combine short sentences
    result = result.replace(/\.\s+([A-Z]\w{1,3}\s+)/g, ', $1');

    // Add transition words
    const sentences = result.split('. ');
    if (sentences.length > 1) {
      const transitions = [
        'Additionally',
        'Furthermore',
        'Moreover',
        'In addition',
      ];
      const randomTransition =
        transitions[Math.floor(Math.random() * transitions.length)];
      sentences[1] = `${randomTransition}, ${sentences[1].toLowerCase()}`;
      result = sentences.join('. ');
    }

    return result;
  }
}
