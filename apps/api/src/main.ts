import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import type { EditionResponse } from '@readr/contracts';

import { AppModule } from './app.module';
import { seedIfEmpty } from './db/seed';
import { getCurrent12HourWindowLabel } from './lib/timeWindow';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const dataSource = app.get(DataSource);
  const windowLabel = getCurrent12HourWindowLabel();

  const mockEdition: EditionResponse = {
    window: windowLabel,
    cards: [
      { id: 'welcome-1', type: 'WELCOME' },
      {
        id: 'home-1',
        type: 'HOME',
        payload: {
          greetingName: 'Anuraag',
          location: 'Dallas, TX',
          windowLabel,
        },
      },
      {
        id: 'news-1',
        type: 'NEWS',
        payload: {
          headline: 'Markets steady as investors await major economic data',
          whatHappened:
            'Major indices traded in a narrow range while traders positioned for upcoming reports.',
          whyItMatters:
            'Key releases can shift rate expectations and affect borrowing costs across the economy.',
          whatsNext:
            'Watch inflation and jobs data for clearer direction this week.',
          source: 'Mock Source',
        },
      },
      {
        id: 'news-2',
        type: 'NEWS',
        payload: {
          headline: 'City expands transit pilot program to more neighborhoods',
          whatHappened:
            'A new set of routes will be added to improve connectivity during peak hours.',
          whyItMatters:
            'Better access can reduce commute times and ease road congestion.',
          source: 'Mock Source',
        },
      },
      { id: 'end-today-1', type: 'END_TODAY' },
      { id: 'extended-1', type: 'EXTENDED' },
      {
        id: 'news-3',
        type: 'NEWS',
        payload: {
          headline:
            'Tech firms highlight AI safety controls in new deployments',
          whatHappened:
            'Several companies described guardrails and evaluation methods for their latest releases.',
          whyItMatters:
            'Better controls reduce risk and improve trust as AI adoption accelerates.',
          whatsNext:
            'Expect more standardization around testing and reporting.',
          source: 'Mock Source',
        },
      },
      { id: 'end-extended-1', type: 'END_EXTENDED' },
    ],
  };

  await seedIfEmpty(dataSource, mockEdition);

  await app.listen(3001);
}

void bootstrap();
