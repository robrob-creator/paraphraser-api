import { Module } from '@nestjs/common';
import { ParaphraserController } from './paraphraser.controller';
import { ParaphraserService } from './paraphraser.service';
import { SimpleParaphraseStrategy } from './strategies/simple-paraphrase.strategy';
import { AdvancedParaphraseStrategy } from './strategies/advanced-paraphrase.strategy';
import { AIParaphraseStrategy } from './strategies/ai-paraphrase.strategy';
import { AIParaphraseService } from './services/ai-paraphrase.service';

@Module({
  imports: [],
  controllers: [ParaphraserController],
  providers: [
    ParaphraserService,
    SimpleParaphraseStrategy,
    AdvancedParaphraseStrategy,
    AIParaphraseStrategy,
    AIParaphraseService,
  ],
  exports: [ParaphraserService],
})
export class ParaphraserModule {}
