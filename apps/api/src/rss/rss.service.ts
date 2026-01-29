import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ParserDefault from 'rss-parser';
import * as ParserNS from 'rss-parser';
import type { RssFetchResult, RssItem } from './rss.types';

type ParsedFeed = {
  title?: string;
  items?: Array<{
    title?: string;
    link?: string;
    isoDate?: string;
    contentSnippet?: string;
    content?: string;
  }>;
};

type ParserInstance = {
  parseURL: (url: string) => Promise<unknown>;
};

type ParserCtor = new () => ParserInstance;

function isCtor(v: unknown): v is ParserCtor {
  return typeof v === 'function';
}

function getDefaultFromNamespace(mod: unknown): unknown {
  if (mod && typeof mod === 'object') {
    const maybe = mod as { default?: unknown };
    return maybe.default;
  }
  return undefined;
}

function getParserCtor(): ParserCtor {
  if (isCtor(ParserDefault)) return ParserDefault;

  const nsDefault = getDefaultFromNamespace(ParserNS);
  if (isCtor(nsDefault)) return nsDefault;

  if (isCtor(ParserNS)) return ParserNS;

  throw new Error('rss-parser import could not be resolved to a constructor');
}

@Injectable()
export class RssIngestionService {
  private readonly parser: ParserInstance;

  constructor(private readonly config: ConfigService) {
    const Ctor = getParserCtor();
    this.parser = new Ctor();
  }

  private getFeedUrls(): string[] {
    const raw = this.config.get<string>('RSS_FEEDS') ?? '';
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private async parseUrl(url: string): Promise<ParsedFeed> {
    const feedUnknown = await this.parser.parseURL(url);
    return feedUnknown as ParsedFeed;
  }

  async fetchTopItems(limit: number): Promise<RssFetchResult> {
    const feedUrls = this.getFeedUrls();

    if (feedUrls.length === 0) {
      return {
        items: [],
        errors: [
          'RSS_FEEDS is empty. Provide comma-separated RSS URLs in env.',
        ],
      };
    }

    const results = await Promise.allSettled(
      feedUrls.map(async (url) => {
        const feed = await this.parseUrl(url);

        const source =
          (typeof feed.title === 'string' && feed.title.trim()) || url;

        const items: RssItem[] = [];

        for (const it of feed.items ?? []) {
          const title = it.title?.trim() ?? '';
          const link = it.link?.trim() ?? '';
          if (!title || !link) continue;

          const snippetRaw = (it.contentSnippet ?? it.content ?? '').trim();
          const snippet = snippetRaw ? snippetRaw.slice(0, 800) : undefined;

          items.push({
            title,
            link,
            isoDate: it.isoDate,
            source,
            snippet,
          });
        }

        return items;
      }),
    );

    const errors: string[] = [];
    const all: RssItem[] = [];

    for (const r of results) {
      if (r.status === 'rejected') {
        errors.push(String(r.reason));
      } else {
        all.push(...r.value);
      }
    }

    const seen = new Set<string>();
    const deduped: RssItem[] = [];
    for (const item of all) {
      const key = item.link || item.title;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }

    deduped.sort((a, b) => {
      const ta = a.isoDate ? Date.parse(a.isoDate) : 0;
      const tb = b.isoDate ? Date.parse(b.isoDate) : 0;
      return tb - ta;
    });

    return {
      items: deduped.slice(0, limit),
      errors,
    };
  }
}
