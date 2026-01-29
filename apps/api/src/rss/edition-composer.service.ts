import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NewsCardPayload } from '@readr/contracts';

import { EditionEntity } from '../db/entities/edition.entity';
import { CardEntity } from '../db/entities/card.entity';

import { SummarizerService } from '../ai/summarizer.service';
import { SummaryCacheService } from '../ai/summary-cache.service';

import { RssIngestionService } from './rss.service';

type ComposeArgs = {
  windowLabel: string;
  template?: EditionEntity | null;
};

type CardType =
  | 'WELCOME'
  | 'HOME'
  | 'NEWS'
  | 'END_TODAY'
  | 'EXTENDED'
  | 'END_EXTENDED';

@Injectable()
export class EditionComposerService {
  constructor(
    @InjectRepository(EditionEntity)
    private readonly editions: Repository<EditionEntity>,
    @InjectRepository(CardEntity)
    private readonly cards: Repository<CardEntity>,
    private readonly rss: RssIngestionService,
    private readonly summarizer: SummarizerService,
    private readonly cache: SummaryCacheService,
  ) {}

  private pushCard(
    edition: EditionEntity,
    position: number,
    cardId: string,
    type: CardType,
    payload: unknown,
  ): void {
    edition.cards.push(
      this.cards.create({
        cardId,
        type,
        position,
        payload: (payload ?? null) as object | null,
      }),
    );
  }

  async composeFromTemplate(args: ComposeArgs): Promise<EditionEntity> {
    const { windowLabel, template } = args;

    const edition = this.editions.create({
      windowLabel,
      cards: [],
    });

    let position = 0;

    // Baseline deck
    this.pushCard(edition, position++, 'welcome-1', 'WELCOME', null);

    this.pushCard(edition, position++, 'home-1', 'HOME', {
      greetingName: 'Anuraag',
      location: 'Dallas, TX',
      windowLabel,
    });

    this.pushCard(edition, position++, 'end-today-1', 'END_TODAY', null);
    this.pushCard(edition, position++, 'extended-1', 'EXTENDED', null);
    this.pushCard(edition, position++, 'end-extended-1', 'END_EXTENDED', null);

    // Overlay non-NEWS from template if present
    if (template?.cards?.length) {
      edition.cards = [];
      position = 0;

      const templateSorted = [...template.cards].sort(
        (a, b) => a.position - b.position,
      );

      for (const c of templateSorted) {
        if (c.type === 'NEWS') continue;

        this.pushCard(
          edition,
          position++,
          c.cardId,
          c.type as CardType,
          c.payload ?? null,
        );
      }
    }

    // Insert NEWS before END_TODAY
    const endTodayIndex = edition.cards.findIndex(
      (c) => c.type === 'END_TODAY',
    );
    const insertAt = endTodayIndex >= 0 ? endTodayIndex : edition.cards.length;

    const { items, errors } = await this.rss.fetchTopItems(6);

    if (items.length === 0) {
      edition.cards = edition.cards.map((c, idx) =>
        this.cards.create({
          cardId: c.cardId,
          type: c.type,
          position: idx,
          payload: c.payload ?? null,
        }),
      );

      void errors;
      return edition;
    }

    const newsCards: CardEntity[] = [];

    for (const item of items) {
      const url = item.link;
      const source = item.source ?? 'Unknown Source';

      // ✅ 1) Cache lookup
      const cached = await this.cache.getByUrl(url);

      let base: NewsCardPayload;
      if (cached) {
        base = cached;
      } else {
        // ✅ 2) Call OpenAI only if missing
        base = await this.summarizer.summarize({
          title: item.title,
          source,
          url,
          snippet: item.snippet,
        });

        // ✅ 3) Save cache
        await this.cache.set({
          url,
          title: item.title,
          source,
          payload: base,
        });
      }

      // Store url in DB payload as extra json field (contracts don’t include it yet)
      const payloadWithUrl: Record<string, unknown> = {
        ...base,
        url,
      };

      newsCards.push(
        this.cards.create({
          cardId: `news-${newsCards.length + 1}`,
          type: 'NEWS',
          position: 0,
          payload: payloadWithUrl,
        }),
      );
    }

    const before = edition.cards.slice(0, insertAt);
    const after = edition.cards.slice(insertAt);

    edition.cards = [...before, ...newsCards, ...after].map((c, idx) =>
      this.cards.create({
        cardId: c.cardId,
        type: c.type,
        position: idx,
        payload: c.payload ?? null,
      }),
    );

    void errors;
    return edition;
  }
}
