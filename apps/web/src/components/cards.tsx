import type { NewsCardPayload, ScreenCard } from "@/lib/mockEdition";

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="h-full w-full px-6 py-10 flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-neutral-600">{subtitle}</p> : null}
        </div>

        <div className="mt-8 flex-1">{children}</div>

        <div className="mt-6 text-xs text-neutral-500">
          Swipe ↑/↓ or use ↑/↓ keys
        </div>
      </div>
    </div>
  );
}

export function WelcomeCard() {
  return (
    <Shell
      title="Welcome to Readr"
      subtitle="Get informed. Get out."
    >
      <div className="space-y-4">
        <p className="text-neutral-700 leading-relaxed">
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
            {["Top", "World", "Business", "Tech", "Science", "Sports"].map((c) => (
              <span
                key={c}
                className="text-xs rounded-full border px-3 py-1 bg-neutral-50"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-neutral-700">
          Swipe up to start reading.
        </p>
      </div>
    </Shell>
  );
}

export function NewsCard({ payload }: { payload: NewsCardPayload }) {
  return (
    <Shell title={payload.headline} subtitle={payload.source ? `Source: ${payload.source}` : undefined}>
      <div className="space-y-5">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500">WHAT HAPPENED</div>
          <p className="mt-2 text-neutral-800 leading-relaxed">{payload.whatHappened}</p>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-neutral-500">WHY IT MATTERS</div>
          <p className="mt-2 text-neutral-800 leading-relaxed">{payload.whyItMatters}</p>
        </section>

        {payload.whatsNext ? (
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-neutral-500">WHAT’S NEXT</div>
            <p className="mt-2 text-neutral-800 leading-relaxed">{payload.whatsNext}</p>
          </section>
        ) : null}
      </div>
    </Shell>
  );
}

export function EndTodayCard() {
  return (
    <Shell title="End of Today’s Edition" subtitle="You’re done. Come back later.">
      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-700 leading-relaxed">
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
          <p className="text-sm text-neutral-700 leading-relaxed">
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
          <p className="text-sm text-neutral-700 leading-relaxed">
            Readr ends quietly. No autoplay. No endless discovery.
          </p>
        </div>
      </div>
    </Shell>
  );
}

export function RenderCard({ card }: { card: ScreenCard }) {
  switch (card.type) {
    case "WELCOME":
      return <WelcomeCard />;
    case "HOME":
      return <HomeCard {...card.payload} />;
    case "NEWS":
      return <NewsCard payload={card.payload} />;
    case "END_TODAY":
      return <EndTodayCard />;
    case "EXTENDED":
      return <ExtendedCard />;
    case "END_EXTENDED":
      return <EndExtendedCard />;
    default:
      return null;
  }
}
