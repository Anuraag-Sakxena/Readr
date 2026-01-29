import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CardEntity } from '../db/entities/card.entity';
import { EditionEntity } from '../db/entities/edition.entity';
import { SessionEntity } from '../db/entities/session.entity';
import { EditionComposerService } from '../rss/edition-composer.service';

@Injectable()
export class WindowService {
  constructor(
    @InjectRepository(EditionEntity)
    private readonly editions: Repository<EditionEntity>,
    @InjectRepository(CardEntity)
    private readonly cards: Repository<CardEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessions: Repository<SessionEntity>,
    private readonly composer: EditionComposerService,
  ) {}

  private async ensureSessionExists(windowLabel: string): Promise<void> {
    const existing = await this.sessions.findOne({
      where: { windowLabel },
    });

    if (existing) return;

    const created = this.sessions.create({
      windowLabel,
      completedToday: false,
      completedExtended: false,
    });

    try {
      await this.sessions.save(created);
    } catch {
      // Ignore race (unique constraint)
    }
  }

  private isSeededMockEdition(edition: EditionEntity): boolean {
    const newsCards = (edition.cards ?? []).filter((c) => c.type === 'NEWS');
    if (newsCards.length === 0) return false;

    return newsCards.every((c) => {
      const payload = c.payload;
      if (!payload || typeof payload !== 'object') return true;

      const p = payload;
      const source = typeof p.source === 'string' ? p.source : '';
      const url = typeof p.url === 'string' ? p.url : '';

      return source === 'Mock Source' || url === '';
    });
  }

  async ensureWindowReady(windowLabel: string): Promise<void> {
    const existingEdition = await this.editions.findOne({
      where: { windowLabel },
      relations: ['cards'],
    });

    if (existingEdition && !this.isSeededMockEdition(existingEdition)) {
      await this.ensureSessionExists(windowLabel);
      return;
    }

    const template =
      existingEdition ??
      (await this.editions.findOne({
        order: { windowLabel: 'DESC' },
        relations: ['cards'],
      }));

    const composed = await this.composer.composeFromTemplate({
      windowLabel,
      template,
    });

    if (existingEdition) {
      await this.cards.delete({ edition: { id: existingEdition.id } });

      existingEdition.cards = composed.cards;

      try {
        await this.editions.save(existingEdition);
      } catch {
        // ignore race
      }

      await this.ensureSessionExists(windowLabel);
      return;
    }

    try {
      await this.editions.save(composed);
    } catch {
      // ignore race
    }

    await this.ensureSessionExists(windowLabel);
  }
}
