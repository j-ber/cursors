import Link from "next/link";
import {
  LIVE_MARKET_ID,
  REPLAY_MARKET_ID,
  formatPct,
  leadingShow,
  loadLiveMarket,
  loadRecommendation,
  loadReplayMarket,
} from "@/lib/fixtures";

export default function SignalFeedPage() {
  const live = loadLiveMarket();
  const replay = loadReplayMarket();
  const rec = loadRecommendation();
  const liveLead = leadingShow(live.odds_by_show);
  const replayLead = leadingShow(replay.odds_by_show);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-5xl font-semibold tracking-tight">Signal Feed</h1>

      <article className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-8 shadow-[var(--shadow)]">
        <p
          className="font-mono text-sm tracking-[0.08em] uppercase"
          style={{ color: "var(--calm)" }}
        >
          ALIGNED
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          {live.title}
        </h2>
        <p className="mt-4 font-mono text-6xl tabular-nums tracking-tight">
          {formatPct(liveLead.p)}
        </p>
        <p className="mt-2 text-lg text-[var(--ink-2)]">{liveLead.show}</p>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed">
          Market prices the likely #1 in line with public evidence.
        </p>
        <p className="mt-4 font-mono text-sm text-[var(--muted)]">
          WATCH · {LIVE_MARKET_ID}
        </p>
      </article>

      <article className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-8 shadow-[var(--shadow)]">
        <p
          className="font-mono text-sm tracking-[0.08em] uppercase"
          style={{ color: "var(--flag)" }}
        >
          HIGH DIVERGENCE {rec.divergence_score}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          {replay.title}
        </h2>
        <p className="mt-4 font-mono text-6xl tabular-nums tracking-tight">
          {formatPct(replayLead.p)}
        </p>
        <p className="mt-2 text-lg text-[var(--ink-2)]">{replayLead.show}</p>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed">
          At the Aug 6 cutoff the market priced Idaho Murders at 48% against
          rising external evidence.
        </p>
        <p className="mt-4 font-mono text-sm text-[var(--muted)]">
          {rec.suggested_side} · {REPLAY_MARKET_ID}
        </p>
        <Link
          href={`/market/${REPLAY_MARKET_ID}`}
          className="mt-8 inline-flex rounded-[var(--r-sm)] px-5 py-3 text-lg font-medium text-[var(--ground)]"
          style={{ background: "var(--market)" }}
        >
          View Why
        </Link>
      </article>
    </main>
  );
}
