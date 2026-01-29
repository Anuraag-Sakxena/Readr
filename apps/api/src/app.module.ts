import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { EditionController } from './edition/edition.controller';
import { SessionController } from './session/session.controller';

import { EditionEntity } from './db/entities/edition.entity';
import { CardEntity } from './db/entities/card.entity';
import { SessionEntity } from './db/entities/session.entity';
import { SummaryCacheEntity } from './db/entities/summary-cache.entity';

import { WindowService } from './window/window.service';
import { RssIngestionService } from './rss/rss.service';
import { EditionComposerService } from './rss/edition-composer.service';
import { SummarizerService } from './ai/summarizer.service';
import { SummaryCacheService } from './ai/summary-cache.service';

function toInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('DB_HOST') ?? 'localhost';
        const port = toInt(config.get<string>('DB_PORT'), 55432);
        const username = config.get<string>('DB_USER') ?? 'readr';
        const password = config.get<string>('DB_PASSWORD') ?? 'readr_password';
        const database = config.get<string>('DB_NAME') ?? 'readr_db';

        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          synchronize: true,
          entities: [
            EditionEntity,
            CardEntity,
            SessionEntity,
            SummaryCacheEntity,
          ],
        };
      },
    }),

    TypeOrmModule.forFeature([
      EditionEntity,
      CardEntity,
      SessionEntity,
      SummaryCacheEntity,
    ]),
  ],
  controllers: [
    AppController,
    HealthController,
    EditionController,
    SessionController,
  ],
  providers: [
    AppService, // ✅ FIX
    WindowService,
    RssIngestionService,
    EditionComposerService,
    SummarizerService,
    SummaryCacheService,
  ],
})
export class AppModule {}
