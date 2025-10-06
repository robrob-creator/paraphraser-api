export class ParaphraseResponseDto {
  originalText: string;
  paraphrasedText: string;
  style: string;
  confidence: number;
  alternativeVersions?: string[];
  processingTime: number;
  wordCount: number;
  characterCount: number;
}

export class ParaphraseErrorDto {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}
