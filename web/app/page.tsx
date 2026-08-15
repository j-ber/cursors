import Link from "next/link";
import { MarketChart } from "@/components/MarketChart";
import { loadRecommendationFixture } from "@/lib/correlator";
import {
  LIVE_SLUG,
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  getMarket,
} from "@/lib/market";

function leading(odds: Record<string, number>) {
  return Object.entries(odds).sort((a, b) => b[1] - a[1])[0];
}

export default async function Feed() {
  const live = await getMarket(LIVE_SLUG);
  const replay = await getMarket(REPLAY_SLUG, REPLAY_CUTOFF);
  const rec = loadRecommendationFixture();
  const liveLead = leading(live.odds_by_outcome);
  const replayLead = leading(replay.odds_by_outcome);

  return (
    <main className="mx-auto max-w-3xl space-y-6 bg-black p-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">DRIFT</h1>
        <a href="/lab" className="text-sm text-[#2e6cff]">
          Test APIs →
        </a>
      </div>
      <p className="text-sm text-[#8b8b8b]">
        Signal feed · source {live.source}/{replay.source}
      </p>

      <article className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#3dd68c]">
          ALIGNED
        </div>
        <h2 className="mt-1 text-lg font-medium">{live.title}</h2>
        {liveLead ? (
          <p className="mt-2 text-sm">
            {liveLead[0]} · {(liveLead[1] * 100).toFixed(1)}%
          </p>
        ) : null}
        <p className="mt-3 text-sm text-[#c8c4bc]">
          Market prices the likely #1 in line with public evidence.
        </p>
        <p className="mt-2 font-mono text-[11px] text-[#8b8b8b]">WATCH</p>
        <div className="mt-3">
          <MarketChart history={live.history} />
        </div>
      </article>

      <article className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#ff6b6b]">
          HIGH DIVERGENCE {rec.divergence_score}
        </div>
        <h2 className="mt-1 text-lg font-medium">{replay.title}</h2>
        {replayLead ? (
          <p className="mt-2 text-sm">
            {replayLead[0]} · {(replayLead[1] * 100).toFixed(1)}% at cutoff
          </p>
        ) : null}
        <p className="mt-3 text-sm text-[#c8c4bc]">{rec.explanation}</p>
        <p className="mt-2 font-mono text-[11px] text-[#8b8b8b]">
          {rec.suggested_side}
        </p>
        <div className="mt-3">
          <MarketChart
            history={replay.history}
            cutoff={REPLAY_CUTOFF}
            revealAfterCutoff={false}
          />
        </div>
        <Link
          href={`/market/${REPLAY_SLUG}`}
          className="mt-4 inline-flex rounded-lg bg-[#2e6cff] px-4 py-2 text-sm font-medium"
        >
          View Why
        </Link>
      </article>
    </main>
  );
}
