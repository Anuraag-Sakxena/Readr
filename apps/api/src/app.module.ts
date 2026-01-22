import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { EditionController } from './edition/edition.controller';
import { SessionController } from './session/session.controller';

@Module({
  imports: [],
  controllers: [AppController, HealthController, EditionController, SessionController],
  providers: [AppService],
})
export class AppModule {}
