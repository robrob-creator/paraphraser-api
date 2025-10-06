import { Test, TestingModule } from '@nestjs/testing';
import { ParaphraserService } from './paraphraser.service';
import { SimpleParaphraseStrategy } from './strategies/simple-paraphrase.strategy';
import { AdvancedParaphraseStrategy } from './strategies/advanced-paraphrase.strategy';
import { AIParaphraseStrategy } from './strategies/ai-paraphrase.strategy';
import { AIParaphraseService } from './services/ai-paraphrase.service';
import { ParaphraseStyle } from './dto/paraphrase-request.dto';

describe('ParaphraserService', () => {
  let service: ParaphraserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParaphraserService,
        SimpleParaphraseStrategy,
        AdvancedParaphraseStrategy,
        AIParaphraseStrategy,
        AIParaphraseService,
      ],
    }).compile();

    service = module.get<ParaphraserService>(ParaphraserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should paraphrase text successfully', async () => {
    const request = {
      text: 'This is a simple test sentence.',
      style: ParaphraseStyle.SIMPLE,
    };

    const result = await service.paraphrase(request);

    expect(result).toBeDefined();
    expect(result.originalText).toBe(request.text);
    expect(result.paraphrasedText).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.characterCount).toBeGreaterThan(0);
  });

  it('should handle formal style paraphrasing', async () => {
    const request = {
      text: "I can't believe this works so well.",
      style: ParaphraseStyle.FORMAL,
    };

    const result = await service.paraphrase(request);

    expect(result.paraphrasedText).not.toContain("can't");
    expect(result.style).toBe(ParaphraseStyle.FORMAL);
  });

  it('should validate input text length', async () => {
    const request = {
      text: 'Hi',
      style: ParaphraseStyle.SIMPLE,
    };

    await expect(service.paraphrase(request)).rejects.toThrow(
      'Text must be at least 5 characters long',
    );
  });

  it('should handle bulk paraphrasing', async () => {
    const requests = [
      { text: 'First test sentence.', style: ParaphraseStyle.SIMPLE },
      { text: 'Second test sentence.', style: ParaphraseStyle.FORMAL },
    ];

    const results = await service.bulkParaphrase(requests);

    expect(results).toHaveLength(2);
    expect(results[0].originalText).toBe(requests[0].text);
    expect(results[1].originalText).toBe(requests[1].text);
  });
});
