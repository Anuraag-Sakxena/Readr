import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NewsCardPayload } from '@readr/contracts';

import { SummaryCacheEntity } from '../db/entities/summary-cache.entity';

@Injectable()
export class SummaryCacheService {
  constructor(
    @InjectRepository(SummaryCacheEntity)
    private readonly repo: Repository<SummaryCacheEntity>,
  ) {}

  async getByUrl(url: string): Promise<NewsCardPayload | null> {
    const row = await this.repo.findOne({ where: { url } });
    if (!row) return null;

    // payload is jsonb; assume it contains NewsCardPayload keys
    return row.payload as unknown as NewsCardPayload;
  }

  async set(args: {
    url: string;
    title: string;
    source: string;
    payload: NewsCardPayload;
  }): Promise<void> {
    const existing = await this.repo.findOne({ where: { url: args.url } });

    if (existing) {
      existing.title = args.title;
      existing.source = args.source;
      existing.payload = args.payload as unknown as Record<string, unknown>;
      await this.repo.save(existing);
      return;
    }

    const created = this.repo.create({
      url: args.url,
      title: args.title,
      source: args.source,
      payload: args.payload as unknown as Record<string, unknown>,
    });

    await this.repo.save(created);
  }
}
