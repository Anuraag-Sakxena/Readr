'use client';

import { useEffect, useState } from 'react';
import type { EditionResponse } from '@readr/contracts';
import ScreenCardEngine from '@/components/ScreenCardEngine';
import { mockEdition } from '@/lib/mockEdition';
import {
  fetchCurrentEdition,
  fetchCurrentSession,
  type SessionState,
} from '@/lib/api';
import type { ScreenCard } from '@readr/contracts';

function getWindowLabelFromCards(cards: ScreenCard[]): string {
  const home = cards.find((c) => c.type === 'HOME');
  return home && home.type === 'HOME'
    ? home.payload.windowLabel
    : 'unknown-window';
}

export default function Home() {
  const [edition, setEdition] = useState<EditionResponse | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [apiEdition, apiSession] = await Promise.all([
          fetchCurrentEdition(),
          fetchCurrentSession(),
        ]);

        if (!alive) return;
        setEdition(apiEdition);
        setSession(apiSession);
      } catch {
        if (!alive) return;

        const fallbackWindow = getWindowLabelFromCards(mockEdition);
        setEdition({
          window: fallbackWindow,
          cards: mockEdition,
        });

        // local fallback session
        setSession({
          window: fallbackWindow,
          completedToday: false,
          completedExtended: false,
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!edition || !session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-neutral-50">
        <div className="rounded-2xl border bg-white px-5 py-3 text-sm text-neutral-700 shadow-sm">
          Loading today’s edition…
        </div>
      </div>
    );
  }

  return (
    <ScreenCardEngine
      cards={edition.cards}
      windowLabel={edition.window}
      initialSession={session}
    />
  );
}
