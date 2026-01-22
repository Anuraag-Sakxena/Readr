"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ScreenCard } from "@/lib/mockEdition";
import { isEndExtended, isEndToday } from "@/lib/mockEdition";
import { RenderCard } from "@/components/cards";



type Props = {
  cards: ScreenCard[];
};

export default function ScreenCardEngine({ cards }: Props) {
  const [index, setIndex] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [completedExtended, setCompletedExtended] = useState(false);


  const clampIndex = (next: number) => Math.max(0, Math.min(cards.length - 1, next));

  const go = (delta: number) => {
    setIndex((prev) => clampIndex(prev + delta));
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") go(1);
      if (e.key === "ArrowUp") go(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  const current = cards[index];
  if (!current) return;

  if (isEndToday(current)) setCompletedToday(true);
  if (isEndExtended(current)) setCompletedExtended(true);
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

    // Swipe up => next card
    if (delta < 0) go(1);
    // Swipe down => previous card
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

        {/* Minimal nav (non-addictive, just utility) */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {cards.map((c, i) => (
            <button
              key={c.id}
              aria-label={`Go to card ${i + 1}`}
              onClick={() => setIndex(i)}
              className={[
                "h-2.5 w-2.5 rounded-full border",
                i === index ? "bg-neutral-900 border-neutral-900" : "bg-transparent border-neutral-300",
              ].join(" ")}
            />
          ))}
        </div>

        

        <div className="fixed left-4 bottom-4 flex gap-2">
          {(completedToday || completedExtended) ? (
  <div className="fixed left-4 top-4 rounded-full border bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm">
    {completedExtended ? "Session complete" : "Today’s edition complete"}
  </div>
) : null}

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
