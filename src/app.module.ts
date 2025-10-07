import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParaphraserModule } from './paraphraser/paraphraser.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 86400000, // 24 hours in milliseconds
        limit: 5, // 5 requests per day
      },
    ]),
    ParaphraserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
