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

type LocalSessionState = {
  window: string;
  completedToday: boolean;
  completedExtended: boolean;
};

function storageKey(windowLabel: string) {
  return `readr:session:${windowLabel}`;
}

function safeWriteLocal(windowLabel: string, state: LocalSessionState) {
  try {
    localStorage.setItem(storageKey(windowLabel), JSON.stringify(state));
  } catch {
    // ignore
  }
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

function findIndex(cards: ScreenCard[], type: ScreenCard['type']) {
  return cards.findIndex((c) => c.type === type);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ScreenCardEngine({
  cards,
  windowLabel,
  initialSession,
}: Props) {
  const isDev = process.env.NODE_ENV !== 'production';

  const [index, setIndex] = useState(0);

  const localBackup =
    typeof window !== 'undefined' ? safeReadLocal(windowLabel) : null;

  const seedCompletedToday =
    localBackup?.completedToday ?? initialSession.completedToday;

  const seedCompletedExtended =
    localBackup?.completedExtended ?? initialSession.completedExtended;

  const [completedToday, setCompletedToday] = useState(seedCompletedToday);
  const [completedExtended, setCompletedExtended] = useState(
    seedCompletedExtended,
  );

  const clampIndex = (next: number) => clamp(next, 0, cards.length - 1);

  const canAdvanceFrom = (idx: number) => {
    const current = cards[idx];
    if (!current) return false;
    return !isEndExtended(current); // hard stop at END_EXTENDED
  };

  const go = (delta: number) => {
    setIndex((prev) => {
      if (delta > 0 && !canAdvanceFrom(prev)) {
        return prev;
      }
      return clampIndex(prev + delta);
    });
  };

  // Jump to the appropriate end card on load based on completion
  useEffect(() => {
    if (completedExtended) {
      const endIdx = findIndex(cards, 'END_EXTENDED');
      setIndex(clampIndex(endIdx >= 0 ? endIdx : cards.length - 1));
      return;
    }

    if (completedToday) {
      const endIdx = findIndex(cards, 'END_TODAY');
      setIndex(clampIndex(endIdx >= 0 ? endIdx : 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowLabel]);

  // Keyboard navigation (DEV only)
  useEffect(() => {
    if (!isDev) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') go(1);
      if (e.key === 'ArrowUp') go(-1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDev, cards.length]);

  // Completion side-effects
  useEffect(() => {
    const current = cards[index];
    if (!current) return;

    (async () => {
      try {
        if (isEndToday(current) && !completedToday) {
          setCompletedToday(true);

          safeWriteLocal(windowLabel, {
            window: windowLabel,
            completedToday: true,
            completedExtended,
          });

          await completeToday(windowLabel);
        }

        if (isEndExtended(current) && !completedExtended) {
          setCompletedToday(true);
          setCompletedExtended(true);

          safeWriteLocal(windowLabel, {
            window: windowLabel,
            completedToday: true,
            completedExtended: true,
          });

          await completeExtended(windowLabel);
        }
      } catch {
        // best effort
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Progress (F3)
  const endTodayIdx = useMemo(() => findIndex(cards, 'END_TODAY'), [cards]);
  const extendedIdx = useMemo(() => findIndex(cards, 'EXTENDED'), [cards]);
  const endExtendedIdx = useMemo(
    () => findIndex(cards, 'END_EXTENDED'),
    [cards],
  );

  const progressText = useMemo(() => {
    if (cards.length === 0) return '';

    const hasEndToday = endTodayIdx >= 0;
    const hasEndExtended = endExtendedIdx >= 0;

    if (hasEndToday && index <= endTodayIdx) {
      const totalToday = endTodayIdx + 1;
      const currentToday = clamp(index + 1, 1, totalToday);
      return `TODAY ${currentToday} / ${totalToday}`;
    }

    const extendedStart =
      extendedIdx >= 0
        ? extendedIdx
        : hasEndToday
          ? endTodayIdx + 1
          : 0;

    const extendedEnd =
      hasEndExtended && endExtendedIdx >= extendedStart
        ? endExtendedIdx
        : cards.length - 1;

    if (index >= extendedStart) {
      const totalExtended = extendedEnd - extendedStart + 1;
      const currentExtended = clamp(index - extendedStart + 1, 1, totalExtended);
      return `EXTENDED ${currentExtended} / ${totalExtended}`;
    }

    return `${index + 1} / ${cards.length}`;
  }, [cards.length, endExtendedIdx, endTodayIdx, extendedIdx, index]);

  // Pointer swipe (drag)
  const startYRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const SWIPE_THRESHOLD = 60;

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    lastYRef.current = e.clientY;

    // Improves reliability: keep receiving move/up events even if pointer leaves element
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    lastYRef.current = e.clientY;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

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

  // ✅ Wheel / trackpad scroll support (this is what you want)
  const lastWheelAtRef = useRef(0);
  const WHEEL_COOLDOWN_MS = 450;
  const WHEEL_THRESHOLD = 30;

  const onWheel = (e: React.WheelEvent) => {
    // prevent the browser from trying to scroll the page (we control navigation)
    e.preventDefault();

    const now = Date.now();
    if (now - lastWheelAtRef.current < WHEEL_COOLDOWN_MS) return;

    const dy = e.deltaY;
    if (Math.abs(dy) < WHEEL_THRESHOLD) return;

    lastWheelAtRef.current = now;

    if (dy > 0) go(1);
    if (dy < 0) go(-1);
  };

  const translateY = useMemo(() => `-${index * 100}vh`, [index]);

  const canGoForward = index < cards.length - 1 && canAdvanceFrom(index);

  return (
    <div className="h-screen w-screen overflow-hidden bg-neutral-50 overscroll-none">
      <div
        className="h-full w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
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

        {progressText ? (
          <div className="fixed left-1/2 top-4 -translate-x-1/2 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
            {progressText}
          </div>
        ) : null}

        {completedToday || completedExtended ? (
          <div className="fixed left-4 top-4 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
            {completedExtended ? 'Session complete' : 'Today’s edition complete'}
          </div>
        ) : null}

        {/* DEV-only buttons */}
        {isDev ? (
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
              disabled={!canGoForward}
            >
              ↓ Down
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
