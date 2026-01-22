'use client';

import { useEffect, useState } from 'react';
import type { EditionResponse, ScreenCard } from '@readr/contracts';
import ScreenCardEngine from '@/components/ScreenCardEngine';
import { mockEdition } from '@/lib/mockEdition';
import {
  fetchCurrentEdition,
  fetchCurrentSession,
  type SessionState,
} from '@/lib/api';

type LocalSessionState = {
  window: string;
  completedToday: boolean;
  completedExtended: boolean;
};

function getWindowLabelFromCards(cards: ScreenCard[]): string {
  const home = cards.find((c) => c.type === 'HOME');
  return home && home.type === 'HOME' ? home.payload.windowLabel : 'unknown-window';
}

function storageKey(windowLabel: string) {
  return `readr:session:${windowLabel}`;
}

function safeReadLocal(windowLabel: string): LocalSessionState | null {
  try {
    const raw = localStorage.getItem(storageKey(windowLabel));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSessionState;
    if (
      typeof parsed?.window === 'string' &&
      typeof parsed?.completedToday === 'boolean' &&
      typeof parsed?.completedExtended === 'boolean'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [edition, setEdition] = useState<EditionResponse | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      // 1) Always try to load edition (API first, fallback to local mock)
      let resolvedEdition: EditionResponse;
      try {
        resolvedEdition = await fetchCurrentEdition();
      } catch {
        const fallbackWindow = getWindowLabelFromCards(mockEdition);
        resolvedEdition = { window: fallbackWindow, cards: mockEdition };
      }

      if (!alive) return;
      setEdition(resolvedEdition);

      // 2) Try to load session from backend; if it fails, fallback to localStorage
      try {
        const apiSession = await fetchCurrentSession();
        if (!alive) return;
        setSession(apiSession);
      } catch {
        if (!alive) return;

        const local = safeReadLocal(resolvedEdition.window);
        setSession(
          local ?? {
            window: resolvedEdition.window,
            completedToday: false,
            completedExtended: false,
          },
        );
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
