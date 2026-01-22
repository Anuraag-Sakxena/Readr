'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ScreenCard } from '@readr/contracts';
import { RenderCard } from '@/components/cards';
import { isEndExtended, isEndToday } from '@/lib/mockEdition';

type Props = {
  cards: ScreenCard[];
  windowLabel: string; // key for persistence
};

type PersistedState = {
  completedToday: boolean;
  completedExtended: boolean;
};

function storageKey(windowLabel: string) {
  return `readr:session:${windowLabel}`;
}

function safeRead(windowLabel: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(storageKey(windowLabel));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (
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

function safeWrite(windowLabel: string, state: PersistedState) {
  try {
    localStorage.setItem(storageKey(windowLabel), JSON.stringify(state));
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

function findIndex(cards: ScreenCard[], type: ScreenCard['type']) {
  return Math.max(
    0,
    cards.findIndex((c) => c.type === type),
  );
}

export default function ScreenCardEngine({ cards, windowLabel }: Props) {
  const [index, setIndex] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [completedExtended, setCompletedExtended] = useState(false);

  const clampIndex = (next: number) =>
    Math.max(0, Math.min(cards.length - 1, next));

  const go = (delta: number) => {
    setIndex((prev) => clampIndex(prev + delta));
  };

  // 1) On first load (or when windowLabel changes), restore persisted completion
  useEffect(() => {
    if (!windowLabel) return;

    const persisted = safeRead(windowLabel);
    if (!persisted) {
      setCompletedToday(false);
      setCompletedExtended(false);
      return;
    }

    setCompletedToday(persisted.completedToday);
    setCompletedExtended(persisted.completedExtended);

    // If already completed, jump to the correct end card
    if (persisted.completedExtended) {
      setIndex(clampIndex(findIndex(cards, 'END_EXTENDED')));
    } else if (persisted.completedToday) {
      setIndex(clampIndex(findIndex(cards, 'END_TODAY')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowLabel]);

  // 2) Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowUp') go(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3) Track completion when landing on end cards + persist
  useEffect(() => {
    const current = cards[index];
    if (!current) return;

    let nextToday = completedToday;
    let nextExtended = completedExtended;

    if (isEndToday(current)) nextToday = true;
    if (isEndExtended(current)) nextExtended = true;

    if (nextToday !== completedToday) setCompletedToday(nextToday);
    if (nextExtended !== completedExtended) setCompletedExtended(nextExtended);

    if (!windowLabel) return;

    // Persist whenever we change completion
    if (
      nextToday !== completedToday ||
      nextExtended !== completedExtended
    ) {
      safeWrite(windowLabel, {
        completedToday: nextToday,
        completedExtended: nextExtended,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, index]);

  // Touch/Pointer swipe
  const startYRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const SWIPE_THRESHOLD = 60; // px

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    lastYRef.current = e.clientY;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    lastYRef.current = e.clientY;
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    const startY = startYRef.current;
    const lastY = lastYRef.current;
    startYRef.current = null;
    lastYRef.current = null;

    if (startY == null || lastY == null) return;

    const delta = lastY - startY; // + down, - up
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;

    if (delta < 0) go(1); // swipe up
    if (delta > 0) go(-1); // swipe down
  };

  const translateY = useMemo(() => `-${index * 100}vh`, [index]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-50">
      <div
        className="h-full w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateY(${translateY})` }}
        >
          {cards.map((card) => (
            <section key={card.id} className="h-screen w-screen">
              <RenderCard card={card} />
            </section>
          ))}
        </div>

        {/* Calm completion badge */}
        {completedToday || completedExtended ? (
          <div className="fixed left-4 top-4 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
            {completedExtended ? 'Session complete' : 'Today’s edition complete'}
          </div>
        ) : null}

        {/* Minimal nav (utility only) */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {cards.map((c, i) => (
            <button
              key={c.id}
              aria-label={`Go to card ${i + 1}`}
              onClick={() => setIndex(i)}
              className={[
                'h-2.5 w-2.5 rounded-full border',
                i === index
                  ? 'bg-neutral-900 border-neutral-900'
                  : 'bg-transparent border-neutral-300',
              ].join(' ')}
            />
          ))}
        </div>

        <div className="fixed left-4 bottom-4 flex gap-2">
          <button
            onClick={() => go(-1)}
            className="rounded-full border bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-40"
            disabled={index === 0}
          >
            ↑ Up
          </button>
          <button
            onClick={() => go(1)}
            className="rounded-full border bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-40"
            disabled={index === cards.length - 1}
          >
            ↓ Down
          </button>
        </div>
      </div>
    </div>
  );
}
