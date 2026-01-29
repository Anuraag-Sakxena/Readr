'use client';

import type React from 'react';
import type { NewsCardPayload, ScreenCard } from '@readr/contracts';

type ExtendedNewsPayload = NewsCardPayload & {
  imageUrl?: string;
  category?: string;
  readTime?: string;
  publishedAgo?: string;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function Section({
  label,
  children,
  tone = 'light',
}: {
  label: string;
  children: React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  const labelClass = tone === 'dark' ? 'text-white/75' : 'text-neutral-500';
  const textClass = tone === 'dark' ? 'text-white/95' : 'text-neutral-800';

  return (
    <div className="space-y-2">
      <div className={clsx('text-xs font-semibold tracking-wide', labelClass)}>
        {label}
      </div>
      <div className={clsx('text-[15px] leading-relaxed', textClass)}>
        {children}
      </div>
    </div>
  );
}

function MetaPill({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-full bg-black/30 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
      {children}
    </span>
  );
}

function FullBleedImage({
  imageUrl,
  children,
}: {
  imageUrl: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />

        {/* Readability scrims (calm, not harsh) */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="relative h-full w-full">{children}</div>
    </div>
  );
}

function ReadingSurface({
  tone,
  children,
}: {
  tone: 'light' | 'dark';
  children: React.ReactNode;
}) {
  if (tone === 'dark') {
    return (
      <div className="rounded-3xl border border-white/20 bg-white/12 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        {children}
      </div>
    );
  }

  return <div className="rounded-3xl border bg-white p-6 shadow-sm">{children}</div>;
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <div className="flex h-full w-full flex-col px-6 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm text-neutral-600">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-8 flex-1">{children}</div>

        {isDev ? (
          <div className="mt-6 text-xs text-neutral-500">
            Swipe ↑/↓ or use ↑/↓ keys
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function WelcomeCard() {
  return (
    <Shell title="Welcome to Readr" subtitle="Get informed. Get out.">
      <div className="space-y-4">
        <p className="leading-relaxed text-neutral-700">
          Readr is built for clarity—finite editions, clean summaries, and a calm end.
        </p>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-700">
            Phase 1: this is mocked data. Next we’ll wire real edition + session logic.
          </p>
        </div>
      </div>
    </Shell>
  );
}

export function HomeCard({
  greetingName,
  location,
  windowLabel,
}: {
  greetingName: string;
  location: string;
  windowLabel: string;
}) {
  return (
    <Shell
      title={`Good evening, ${greetingName}.`}
      subtitle={`${location} • Window: ${windowLabel}`}
    >
      <div className="space-y-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-neutral-600">Categories</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Top', 'World', 'Business', 'Tech', 'Science', 'Sports'].map((c) => (
              <span
                key={c}
                className="rounded-full border bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-neutral-700">Swipe up to start reading.</p>
      </div>
    </Shell>
  );
}

function NewsCardPlain({ payload }: { payload: NewsCardPayload }) {
  return (
    <Shell title={payload.headline} subtitle={payload.source ?? undefined}>
      <div className="space-y-4">
        {/* Single unified reading surface (refined) */}
        <ReadingSurface tone="light">
          <Section label="WHAT HAPPENED">
            <p>{payload.whatHappened}</p>
          </Section>

          <div className="mt-5 border-t pt-5">
            <Section label="WHY IT MATTERS">
              <p>{payload.whyItMatters}</p>
            </Section>
          </div>

          {payload.whatsNext ? (
            <div className="mt-5 border-t pt-5">
              <Section label="WHAT’S NEXT">
                <p>{payload.whatsNext}</p>
              </Section>
            </div>
          ) : null}
        </ReadingSurface>

        <p className="text-xs text-neutral-500">Finite by design — you’ll reach an end.</p>
      </div>
    </Shell>
  );
}

function NewsCardHero({ payload }: { payload: ExtendedNewsPayload }) {
  const category = payload.category ?? 'News';
  const source = payload.source ?? 'Source';
  const publishedAgo = payload.publishedAgo ?? 'Just now';
  const readTime = payload.readTime ?? '2–3 min';

  // imageUrl is required for hero layout
  if (!payload.imageUrl) {
    return <NewsCardPlain payload={payload} />;
  }

  return (
    <FullBleedImage imageUrl={payload.imageUrl}>
      <div className="flex h-full w-full flex-col px-6 py-10">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          {/* Top meta */}
          <div className="flex items-center gap-2">
            <MetaPill>{category}</MetaPill>
            <MetaPill>{readTime}</MetaPill>
            <MetaPill>{publishedAgo}</MetaPill>
          </div>

          {/* Bottom stack */}
          <div className="mt-auto space-y-3">
            <div className="text-xs font-semibold tracking-wide text-white/80">
              {source.toUpperCase()}
            </div>

            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
              {payload.headline}
            </h1>

            <ReadingSurface tone="dark">
              <Section label="WHAT HAPPENED" tone="dark">
                <p>{payload.whatHappened}</p>
              </Section>

              <div className="mt-5 border-t border-white/15 pt-5">
                <Section label="WHY IT MATTERS" tone="dark">
                  <p>{payload.whyItMatters}</p>
                </Section>
              </div>

              {payload.whatsNext ? (
                <div className="mt-5 border-t border-white/15 pt-5">
                  <Section label="WHAT’S NEXT" tone="dark">
                    <p>{payload.whatsNext}</p>
                  </Section>
                </div>
              ) : null}
            </ReadingSurface>

            <p className="text-xs text-white/70">Finite by design — you’ll reach an end.</p>
          </div>
        </div>
      </div>
    </FullBleedImage>
  );
}

export function NewsCard({ payload }: { payload: NewsCardPayload }) {
  const p = payload as ExtendedNewsPayload;

  /**
   * ✅ SIMPLE APPROACH (no contracts change needed)
   * We temporarily map hero images by headline.
   * Later, AI/Backend can send payload.imageUrl and this will still work.
   */
  const heroImageByHeadline: Record<string, string> = {
    'Markets steady as investors await major economic data':
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
  };

  const resolvedImageUrl = p.imageUrl ?? heroImageByHeadline[p.headline];

  if (resolvedImageUrl) {
    return (
      <NewsCardHero
        payload={{
          ...p,
          imageUrl: resolvedImageUrl,
          category: p.category ?? 'Markets',
          readTime: p.readTime ?? '3 min read',
          publishedAgo: p.publishedAgo ?? '2 hours ago',
        }}
      />
    );
  }

  return <NewsCardPlain payload={payload} />;
}

export function EndTodayCard() {
  return (
    <Shell title="End of Today’s Edition" subtitle="You’re done. Come back later.">
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm leading-relaxed text-neutral-700">
            This is a hard stop by design. No infinite feed.
          </p>
        </div>
        <p className="text-sm text-neutral-700">
          Swipe up for optional extended coverage (still finite).
        </p>
      </div>
    </Shell>
  );
}

export function ExtendedCard() {
  return (
    <Shell title="Extended Coverage" subtitle="Optional. Still finite.">
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm leading-relaxed text-neutral-700">
            Extended coverage provides a bit more depth, then ends.
          </p>
        </div>
        <p className="text-sm text-neutral-700">Swipe up to continue.</p>
      </div>
    </Shell>
  );
}

export function EndExtendedCard() {
  return (
    <Shell title="That’s the end." subtitle="Session complete.">
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm leading-relaxed text-neutral-700">
            Readr ends quietly. No autoplay. No endless discovery.
          </p>
        </div>
      </div>
    </Shell>
  );
}

export function RenderCard({ card }: { card: ScreenCard }) {
  switch (card.type) {
    case 'WELCOME':
      return <WelcomeCard />;
    case 'HOME':
      return <HomeCard {...card.payload} />;
    case 'NEWS':
      return <NewsCard payload={card.payload} />;
    case 'END_TODAY':
      return <EndTodayCard />;
    case 'EXTENDED':
      return <ExtendedCard />;
    case 'END_EXTENDED':
      return <EndExtendedCard />;
    default:
      return null;
  }
}
