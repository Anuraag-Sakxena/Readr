'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ScreenCard } from '@readr/contracts';
import { RenderCard } from '@/components/cards';
import { isEndExtended, isEndToday } from '@/lib/mockEdition';
import {
  completeExtended,
  completeToday,
  type SessionState,
} from '@/lib/api';

type Props = {
  cards: ScreenCard[];
  windowLabel: string;
  initialSession: SessionState;
};

function findIndex(cards: ScreenCard[], type: ScreenCard['type']) {
  const idx = cards.findIndex((c) => c.type === type);
  return idx >= 0 ? idx : 0;
}

export default function ScreenCardEngine({
  cards,
  windowLabel,
  initialSession,
}: Props) {
  const [index, setIndex] = useState(0);
  const [completedToday, setCompletedToday] = useState(
    initialSession.completedToday,
  );
  const [completedExtended, setCompletedExtended] = useState(
    initialSession.completedExtended,
  );

  const clampIndex = (next: number) =>
    Math.max(0, Math.min(cards.length - 1, next));

  const go = (delta: number) => setIndex((prev) => clampIndex(prev + delta));

  // On load: if session already completed, jump to end card
  useEffect(() => {
    if (completedExtended) {
      setIndex(clampIndex(findIndex(cards, 'END_EXTENDED')));
    } else if (completedToday) {
      setIndex(clampIndex(findIndex(cards, 'END_TODAY')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowLabel]);

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowUp') go(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When landing on end cards, update UI state + notify backend
  useEffect(() => {
    const current = cards[index];
    if (!current) return;

    (async () => {
      try {
        if (isEndToday(current) && !completedToday) {
          setCompletedToday(true);
          await completeToday(windowLabel);
        }

        if (isEndExtended(current) && !completedExtended) {
          setCompletedToday(true);
          setCompletedExtended(true);
          await completeExtended(windowLabel);
        }
      } catch {
        // If backend fails, we still keep UI completed (calm behavior)
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Swipe
  const startYRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const SWIPE_THRESHOLD = 60;

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

    const delta = lastY - startY;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;

    if (delta < 0) go(1);
    if (delta > 0) go(-1);
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

        {completedToday || completedExtended ? (
          <div className="fixed left-4 top-4 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
            {completedExtended ? 'Session complete' : 'Today’s edition complete'}
          </div>
        ) : null}

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
