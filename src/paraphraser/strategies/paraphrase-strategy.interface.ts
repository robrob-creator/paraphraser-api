export interface ParaphraseStrategy {
  paraphrase(
    text: string,
    style: string,
    targetLanguage?: string,
  ): Promise<{
    paraphrasedText: string;
    confidence: number;
    alternativeVersions?: string[];
  }>;
}
