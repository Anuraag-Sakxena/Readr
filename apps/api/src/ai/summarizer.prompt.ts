export type SummarizerInput = {
  title: string;
  source: string; // required
  url: string;
  snippet?: string;
};

export type NewsSummary = {
  headline: string;
  whatHappened: string;
  whyItMatters: string;
  whatsNext: string; // keep required; can be ""
  source: string;
};

export const NEWS_SUMMARY_SCHEMA = {
  name: 'news_summary',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      headline: { type: 'string' },
      whatHappened: { type: 'string' },
      whyItMatters: { type: 'string' },
      whatsNext: { type: 'string' },
      source: { type: 'string' },
    },
    required: ['headline', 'whatHappened', 'whyItMatters', 'whatsNext', 'source'],
  },
} as const;

export function buildSummarizerPrompt(input: SummarizerInput): string {
  const snippet = input.snippet ? input.snippet.trim() : '';

  return `
You are Readr's news summarizer.

Return ONLY valid JSON that matches this structure:
{
  "headline": string,
  "whatHappened": string,
  "whyItMatters": string,
  "whatsNext": string,
  "source": string
}

Rules:
- Keep it concise and factual.
- Use the provided source as the "source" field (do not invent new publishers).
- If "whatsNext" is not clear, return an empty string "" (but the key must exist).

Input:
Title: ${input.title}
Source: ${input.source}
URL: ${input.url}
Snippet: ${snippet || '(none)'}
`.trim();
}
