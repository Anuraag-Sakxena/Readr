import type { ScreenCard } from '@/lib/mockEdition';

type EditionResponse = {
  window: string;
  cards: ScreenCard[];
};

export async function fetchCurrentEdition(): Promise<ScreenCard[]> {
  const res = await fetch('http://localhost:3001/edition/current', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }

  const data = (await res.json()) as EditionResponse;

  if (!data?.cards || !Array.isArray(data.cards)) {
    throw new Error('Invalid edition response');
  }

  return data.cards;
}
