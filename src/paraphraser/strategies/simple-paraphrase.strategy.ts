import { Injectable } from '@nestjs/common';
import { ParaphraseStrategy } from './paraphrase-strategy.interface';

@Injectable()
export class SimpleParaphraseStrategy implements ParaphraseStrategy {
  private synonyms: { [key: string]: string[] } = {
    big: ['large', 'huge', 'enormous', 'massive', 'giant'],
    small: ['tiny', 'little', 'mini', 'compact', 'minute'],
    good: ['excellent', 'great', 'fantastic', 'wonderful', 'amazing'],
    bad: ['terrible', 'awful', 'horrible', 'dreadful', 'poor'],
    fast: ['quick', 'rapid', 'swift', 'speedy', 'hasty'],
    slow: ['sluggish', 'gradual', 'leisurely', 'unhurried'],
    happy: ['joyful', 'pleased', 'delighted', 'cheerful', 'content'],
    sad: ['unhappy', 'sorrowful', 'melancholy', 'dejected', 'gloomy'],
    important: ['crucial', 'vital', 'essential', 'significant', 'critical'],
    beautiful: ['gorgeous', 'stunning', 'lovely', 'attractive', 'elegant'],
    easy: ['simple', 'effortless', 'straightforward', 'uncomplicated'],
    difficult: ['challenging', 'tough', 'hard', 'complex', 'demanding'],
    new: ['fresh', 'recent', 'modern', 'novel', 'latest'],
    old: ['ancient', 'aged', 'vintage', 'mature', 'elderly'],
    help: ['assist', 'aid', 'support', 'guide', 'facilitate'],
    make: ['create', 'produce', 'construct', 'build', 'generate'],
    get: ['obtain', 'acquire', 'receive', 'gain', 'secure'],
    use: ['utilize', 'employ', 'apply', 'implement', 'operate'],
    think: ['consider', 'contemplate', 'ponder', 'reflect', 'believe'],
    say: ['state', 'declare', 'express', 'mention', 'articulate'],
    look: ['observe', 'examine', 'view', 'glance', 'peer'],
    come: ['arrive', 'approach', 'reach', 'appear', 'emerge'],
    go: ['proceed', 'advance', 'travel', 'move', 'depart'],
    want: ['desire', 'wish', 'crave', 'seek', 'yearn'],
    know: ['understand', 'comprehend', 'realize', 'recognize', 'grasp'],
    take: ['grab', 'seize', 'capture', 'pick', 'collect'],
    see: ['notice', 'spot', 'witness', 'observe', 'detect'],
    work: ['function', 'operate', 'perform', 'labor', 'toil'],
    find: ['discover', 'locate', 'identify', 'uncover', 'detect'],
  };

  async paraphrase(
    text: string,
    style: string,
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions?: string[];
  }> {
    const words = text.toLowerCase().split(/\s+/);
    const paraphrasedWords: string[] = [];
    let changesMade = 0;

    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');

      if (this.synonyms[cleanWord]) {
        const synonyms = this.synonyms[cleanWord];
        const randomSynonym =
          synonyms[Math.floor(Math.random() * synonyms.length)];

        // Preserve original capitalization
        const finalWord = this.preserveCapitalization(word, randomSynonym);
        paraphrasedWords.push(finalWord);
        changesMade++;
      } else {
        paraphrasedWords.push(word);
      }
    }

    // Apply style-specific transformations
    let paraphrasedText = paraphrasedWords.join(' ');
    paraphrasedText = this.applyStyleTransformations(paraphrasedText, style);

    // Calculate confidence based on changes made
    const confidence = Math.min(0.9, Math.max(0.3, changesMade / words.length));

    // Generate alternative versions
    const alternativeVersions = await this.generateAlternatives(text, style);

    return {
      paraphrasedText,
      confidence,
      alternativeVersions,
    };
  }

  private preserveCapitalization(
    original: string,
    replacement: string,
  ): string {
    if (original[0] === original[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }

  private applyStyleTransformations(text: string, style: string): string {
    switch (style) {
      case 'formal':
        return text
          .replace(/\bcan't\b/g, 'cannot')
          .replace(/\bwon't\b/g, 'will not')
          .replace(/\bdon't\b/g, 'do not')
          .replace(/\bisn't\b/g, 'is not')
          .replace(/\baren't\b/g, 'are not');

      case 'casual':
        return text
          .replace(/\bcannot\b/g, "can't")
          .replace(/\bwill not\b/g, "won't")
          .replace(/\bdo not\b/g, "don't")
          .replace(/\bis not\b/g, "isn't")
          .replace(/\bare not\b/g, "aren't");

      case 'academic':
        return text
          .replace(/\bI think\b/g, 'It is believed that')
          .replace(/\bIn my opinion\b/g, 'From this perspective')
          .replace(/\bBasically\b/g, 'Fundamentally');

      default:
        return text;
    }
  }

  private async generateAlternatives(
    text: string,
    style: string,
  ): Promise<string[]> {
    const alternatives: string[] = [];

    // Generate 2-3 alternative versions with different synonym choices
    for (let i = 0; i < 2; i++) {
      const words = text.toLowerCase().split(/\s+/);
      const paraphrasedWords: string[] = [];

      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, '');

        if (this.synonyms[cleanWord]) {
          const synonyms = this.synonyms[cleanWord];
          const randomSynonym =
            synonyms[Math.floor(Math.random() * synonyms.length)];

          // Preserve original capitalization
          const finalWord = this.preserveCapitalization(word, randomSynonym);
          paraphrasedWords.push(finalWord);
        } else {
          paraphrasedWords.push(word);
        }
      }

      let alternativeText = paraphrasedWords.join(' ');
      alternativeText = this.applyStyleTransformations(alternativeText, style);

      if (alternativeText !== text && !alternatives.includes(alternativeText)) {
        alternatives.push(alternativeText);
      }
    }

    return alternatives.slice(0, 3);
  }
}
