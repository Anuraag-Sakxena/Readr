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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [EditionEntity, CardEntity, SessionEntity],
        synchronize: true, // DEV ONLY
      }),
    }),

    TypeOrmModule.forFeature([EditionEntity, CardEntity, SessionEntity]),
  ],
  controllers: [
    AppController,
    HealthController,
    EditionController,
    SessionController,
  ],
  providers: [AppService],
})
export class AppModule {}
