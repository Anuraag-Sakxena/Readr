import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EditionResponse, ScreenCard } from '@readr/contracts';
import { Repository } from 'typeorm';

import { CardEntity } from '../db/entities/card.entity';
import { EditionEntity } from '../db/entities/edition.entity';
import { getCurrent12HourWindowLabel } from '../lib/timeWindow';

// Derive the specific card union members from ScreenCard (no need to import HomeCard/NewsCard)
type HomeCard = Extract<ScreenCard, { type: 'HOME' }>;
type NewsCard = Extract<ScreenCard, { type: 'NEWS' }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toHomeCard(row: CardEntity): HomeCard {
  const payload = (isRecord(row.payload)
    ? row.payload
    : {}) as unknown as HomeCard['payload'];

  return {
    id: row.cardId,
    type: 'HOME',
    payload,
  };
}

function toNewsCard(row: CardEntity): NewsCard {
  const payload = (isRecord(row.payload)
    ? row.payload
    : {}) as unknown as NewsCard['payload'];

  return {
    id: row.cardId,
    type: 'NEWS',
    payload,
  };
}

function toScreenCard(row: CardEntity): ScreenCard {
  if (row.type === 'HOME') return toHomeCard(row);
  if (row.type === 'NEWS') return toNewsCard(row);

  // Non-payload cards (WELCOME, END_TODAY, EXTENDED, END_EXTENDED, etc.)
  return {
    id: row.cardId,
    type: row.type as ScreenCard['type'],
  } as ScreenCard;
}

@Controller('edition')
export class EditionController {
  constructor(
    @InjectRepository(EditionEntity)
    private readonly editions: Repository<EditionEntity>,
  ) {}

  @Get('current')
  async current(): Promise<EditionResponse> {
    const windowLabel = getCurrent12HourWindowLabel();

    const edition = await this.editions.findOne({
      where: { windowLabel },
      relations: ['cards'],
    });

    if (!edition) {
      return { window: windowLabel, cards: [] };
    }

    const cardsSorted = [...(edition.cards ?? [])].sort(
      (a, b) => a.position - b.position,
    );

    return {
      window: windowLabel,
      cards: cardsSorted.map(toScreenCard),
    };
  }
}
