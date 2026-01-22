import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EditionEntity } from '../db/entities/edition.entity';
import { CardEntity } from '../db/entities/card.entity';
import { SessionEntity } from '../db/entities/session.entity';

@Injectable()
export class WindowService {
  constructor(
    @InjectRepository(EditionEntity)
    private readonly editions: Repository<EditionEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessions: Repository<SessionEntity>,
  ) {}

  private async ensureSessionExists(windowLabel: string): Promise<void> {
    const existing = await this.sessions.findOne({
      where: { windowLabel },
    });

    if (existing) {
      return;
    }

    const created = this.sessions.create({
      windowLabel,
      completedToday: false,
      completedExtended: false,
    });

    try {
      await this.sessions.save(created);
    } catch {
      // Safe to ignore: unique constraint hit during race
    }
  }

  async ensureWindowReady(windowLabel: string): Promise<void> {
    const existingEdition = await this.editions.findOne({
      where: { windowLabel },
      relations: ['cards'],
    });

    if (existingEdition) {
      await this.ensureSessionExists(windowLabel);
      return;
    }

    const template = await this.editions.findOne({
      order: { windowLabel: 'DESC' },
      relations: ['cards'],
    });

    const edition = new EditionEntity();
    edition.windowLabel = windowLabel;

    if (template?.cards?.length) {
      const sorted = [...template.cards].sort(
        (a, b) => a.position - b.position,
      );

      edition.cards = sorted.map((c) => {
        const card = new CardEntity();
        card.cardId = c.cardId;
        card.type = c.type;
        card.position = c.position;
        card.payload = c.payload ?? null;
        card.edition = edition;
        return card;
      });
    } else {
      edition.cards = [];
    }

    try {
      await this.editions.save(edition);
    } catch {
      // Safe to ignore: another request created it first
    }

    await this.ensureSessionExists(windowLabel);
  }
}
