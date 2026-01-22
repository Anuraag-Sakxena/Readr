'use client';

import { useEffect, useState } from 'react';
import ScreenCardEngine from '@/components/ScreenCardEngine';
import { mockEdition, type ScreenCard } from '@/lib/mockEdition';
import { fetchCurrentEdition } from '@/lib/api';

export default function Home() {
  const [cards, setCards] = useState<ScreenCard[] | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const apiCards = await fetchCurrentEdition();
        if (alive) setCards(apiCards);
      } catch {
        if (alive) setCards(mockEdition);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!cards) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
        <div className="rounded-2xl border bg-white px-5 py-3 text-sm text-neutral-700 shadow-sm">
          Loading today’s edition…
        </div>
      </div>
    );
  }

  return <ScreenCardEngine cards={cards} />;
}
