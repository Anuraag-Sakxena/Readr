import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NewsCardPayload } from '@readr/contracts';

import {
  buildSummarizerPrompt,
  NEWS_SUMMARY_SCHEMA,
  type NewsSummary,
  type SummarizerInput,
} from './summarizer.prompt';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/**
 * Responses API may return text in:
 * - output_text (sometimes empty)
 * - output[].content[].text where content[].type === "output_text"
 */
function extractOutputText(resp: unknown): string {
  if (!isRecord(resp)) return '';

  // 1) Prefer output_text if present
  const direct = asString(resp.output_text);
  if (direct) return direct;

  // 2) Fallback: walk output[].content[]
  const output = asArray(resp.output);
  const chunks: string[] = [];

  for (const outItem of output) {
    if (!isRecord(outItem)) continue;

    const content = asArray(outItem.content);
    for (const c of content) {
      if (!isRecord(c)) continue;

      const type = asString(c.type);
      if (type !== 'output_text') continue;

      const text = asString(c.text);
      if (text) chunks.push(text);
    }
  }

  return chunks.join('\n').trim();
}

@Injectable()
export class SummarizerService {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY') ?? '';
    this.model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  async summarize(input: SummarizerInput): Promise<NewsCardPayload> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is missing in environment');
    }

    const prompt = buildSummarizerPrompt(input);

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: NEWS_SUMMARY_SCHEMA.name,
            strict: NEWS_SUMMARY_SCHEMA.strict,
            schema: NEWS_SUMMARY_SCHEMA.schema,
          },
        },
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${msg}`);
    }

    const dataUnknown = (await res.json()) as unknown;

    const raw = extractOutputText(dataUnknown);
    if (!raw) {
      throw new Error(
        `OpenAI returned empty output text. Response keys: ${
          isRecord(dataUnknown) ? Object.keys(dataUnknown).join(', ') : 'none'
        }`,
      );
    }

    let parsed: NewsSummary;
    try {
      parsed = JSON.parse(raw) as NewsSummary;
    } catch {
      throw new Error(`OpenAI returned non-JSON output: ${raw}`);
    }

    const payload: NewsCardPayload = {
      headline: asString(parsed.headline) || input.title,
      whatHappened: asString(parsed.whatHappened),
      whyItMatters: asString(parsed.whyItMatters),
      whatsNext: asString(parsed.whatsNext), // can be ""
      source: asString(parsed.source) || input.source,
    };

    return payload;
  }
}
