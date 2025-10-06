import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParaphraserModule } from './paraphraser/paraphraser.module';

@Module({
  imports: [ParaphraserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
