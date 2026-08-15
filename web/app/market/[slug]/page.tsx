import Link from "next/link";
import { notFound } from "next/navigation";
import EvidencePanel from "@/components/EvidencePanel";
import { MarketChart } from "@/components/MarketChart";
import Replay from "@/components/Replay";
import {
  correlateForSlug,
  loadCultureFixture,
  loadEvidenceFixture,
  loadRecommendationFixture,
} from "@/lib/correlator";
import {
  LIVE_SLUG,
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  getMarket,
} from "@/lib/market";
import type { Culture, Evidence, Market, Recommendation } from "../../../../shared/types/contract";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ slug: LIVE_SLUG }, { slug: REPLAY_SLUG }];
}

function leading(odds: Record<string, number>) {
  return Object.entries(odds).sort((a, b) => b[1] - a[1])[0];
}

function Badge({ label }: { label: "live" | "fixture" }) {
  const live = label === "live";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
        live ? "bg-[#1a3d2c] text-[#3dd68c]" : "bg-[#2a2410] text-[#e6c35c]"
      }`}
    >
      {label}
    </span>
  );
}

export default async function InvestigationPage({
  params,
}: PageProps<"/market/[slug]">) {
  const { slug } = await params;
  if (slug !== LIVE_SLUG && slug !== REPLAY_SLUG) notFound();

  const asOf = slug === REPLAY_SLUG ? REPLAY_CUTOFF : undefined;

  const [marketR, evidenceR, recR] = await Promise.allSettled([
    getMarket(slug, asOf),
    Promise.resolve(loadEvidenceFixture()),
    correlateForSlug(slug, asOf),
  ]);

  const market: Market | null =
    marketR.status === "fulfilled" ? marketR.value : null;
  const evidence: Evidence =
    evidenceR.status === "fulfilled"
      ? evidenceR.value
      : loadEvidenceFixture();
  const culture: Culture = loadCultureFixture();
  const rec: Recommendation =
    recR.status === "fulfilled" ? recR.value : loadRecommendationFixture();

  if (!market) notFound();

  const lead = leading(market.odds_by_outcome);
  const recLive = rec.source === "grok";
  const marketLive = market.source === "polymarket";
  const evidenceLive = evidence.source !== "fixture";
  const diverged = rec.verdict === "diverged";

  return (
    <main className="mx-auto max-w-3xl space-y-6 bg-black p-6 text-white">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-[#8b8b8b]">
          ← Signal Feed
        </Link>
        <div className="flex gap-2">
          <Badge label={marketLive ? "live" : "fixture"} />
          <span className="text-[10px] uppercase text-[#8b8b8b]">market</span>
          <Badge label={evidenceLive ? "live" : "fixture"} />
          <span className="text-[10px] uppercase text-[#8b8b8b]">evidence</span>
          <Badge label={recLive ? "live" : "fixture"} />
          <span className="text-[10px] uppercase text-[#8b8b8b]">correlator</span>
        </div>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">{market.title}</h1>
      {lead ? (
        <p className="font-mono text-5xl tabular-nums">
          {(lead[1] * 100).toFixed(1)}%
        </p>
      ) : null}
      {lead ? <p className="text-[#8b8b8b]">{lead[0]}</p> : null}

      <section className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
        <h2 className="text-lg font-medium">Odds</h2>
        <MarketChart
          history={market.history}
          cutoff={asOf}
          revealAfterCutoff={slug !== REPLAY_SLUG}
        />
      </section>

      <section className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
        <h2 className="text-lg font-medium">Evidence</h2>
        <p className="mt-2 text-sm">
          Social {evidence.social_score} · Web {evidence.web_score} ·{" "}
          {evidence.trend}
        </p>
        <p className="mt-1 text-sm text-[#8b8b8b]">{evidence.show}</p>
        <EvidencePanel evidence={evidence} />
      </section>

      <section className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b8b]">
          Why?
        </p>
        <h2
          className="mt-2 text-2xl font-semibold"
          style={{ color: diverged ? "#ff6b6b" : "#3dd68c" }}
        >
          {diverged ? "HIGH DIVERGENCE" : "ALIGNED"} {rec.divergence_score}
        </h2>
        <p className="mt-1 font-mono text-sm text-[#8b8b8b]">
          {rec.suggested_side} · confidence {rec.confidence}
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed">
          {rec.explanation}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#c8c4bc]">
          {rec.supporting_reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <div className="mt-5 rounded-lg bg-[#1a1a1a] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b8b]">
            Counterargument
          </p>
          <p className="mt-2 text-sm leading-relaxed">{rec.counterargument}</p>
        </div>
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b8b]">
            Sources
          </p>
          {rec.sources.length === 0 ? (
            <p className="mt-1 text-sm text-[#8b8b8b]">None returned.</p>
          ) : (
            <ul className="mt-1 list-disc pl-5 text-sm text-[#c8c4bc]">
              {rec.sources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-4 font-mono text-[11px] text-[#8b8b8b]">
          as of {rec.as_of} · week of {culture.week_of}
        </p>
      </section>

      <Link
        href="#replay"
        className="inline-flex rounded-lg bg-[#2e6cff] px-4 py-2 text-sm font-medium"
      >
        Replay Last Week
      </Link>
      <section id="replay">
        <Replay />
      </section>
    </main>
  );
}
