'use client';

import { useEffect, useState } from 'react';
import type { ScreenCard, EditionResponse } from '@readr/contracts';
import ScreenCardEngine from '@/components/ScreenCardEngine';
import { mockEdition } from '@/lib/mockEdition';
import { fetchCurrentEdition } from '@/lib/api';

function getWindowLabelFromCards(cards: ScreenCard[]): string {
  const home = cards.find((c) => c.type === 'HOME');
  if (home && home.type === 'HOME') return home.payload.windowLabel;
  return 'unknown-window';
}

export default function Home() {
  const [edition, setEdition] = useState<EditionResponse | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const apiEdition = await fetchCurrentEdition();
        if (alive) setEdition(apiEdition);
      } catch {
        if (!alive) return;

        // fallback to local mock
        const fallback: EditionResponse = {
          window: getWindowLabelFromCards(mockEdition),
          cards: mockEdition,
        };

        setEdition(fallback);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!edition) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
        <div className="rounded-2xl border bg-white px-5 py-3 text-sm text-neutral-700 shadow-sm">
          Loading today’s edition…
        </div>
      </div>
    );
  }

  return <ScreenCardEngine cards={edition.cards} windowLabel={edition.window} />;
}
