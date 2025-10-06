import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ParaphraserController } from './paraphraser.controller';
import { ParaphraserService } from './paraphraser.service';
import { SimpleParaphraseStrategy } from './strategies/simple-paraphrase.strategy';
import { AdvancedParaphraseStrategy } from './strategies/advanced-paraphrase.strategy';
import { AIParaphraseStrategy } from './strategies/ai-paraphrase.strategy';
import { CloudAIParaphraseStrategy } from './strategies/cloud-ai-paraphrase.strategy';
import { AIParaphraseService } from './services/ai-paraphrase.service';
import { CloudAIParaphraseService } from './services/cloud-ai-paraphrase.service';

@Module({
  imports: [ConfigModule],
  controllers: [ParaphraserController],
  providers: [
    ParaphraserService,
    SimpleParaphraseStrategy,
    AdvancedParaphraseStrategy,
    AIParaphraseStrategy,
    CloudAIParaphraseStrategy,
    AIParaphraseService,
    CloudAIParaphraseService,
  ],
  exports: [ParaphraserService],
})
export class ParaphraserModule {}
