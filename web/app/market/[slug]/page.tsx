import Link from "next/link";
import { notFound } from "next/navigation";
import EvidencePanel from "@/components/EvidencePanel";
import MarketChart from "@/components/MarketChart";
import Replay from "@/components/Replay";
import {
  LIVE_MARKET_ID,
  REPLAY_MARKET_ID,
  formatPct,
  leadingShow,
  loadCulture,
  loadEvidence,
  loadMarketBySlug,
  loadRecommendation,
} from "@/lib/fixtures";

export function generateStaticParams() {
  return [{ slug: LIVE_MARKET_ID }, { slug: REPLAY_MARKET_ID }];
}

export default async function InvestigationPage({
  params,
}: PageProps<"/market/[slug]">) {
  const { slug } = await params;
  const market = loadMarketBySlug(slug);
  if (!market) notFound();

  const evidence = loadEvidence();
  const culture = loadCulture();
  const rec = loadRecommendation();
  const lead = leadingShow(market.odds_by_show);

  return (
    <main className="flex flex-col gap-8">
      <Link href="/" className="text-[var(--muted)]">
        ← Signal Feed
      </Link>

      <h1 className="text-5xl font-semibold tracking-tight">{market.title}</h1>
      <p className="font-mono text-7xl tabular-nums tracking-tight">
        {formatPct(lead.p)}
      </p>
      <p className="text-xl text-[var(--ink-2)]">{lead.show}</p>

      <section className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-8">
        <h2 className="text-2xl font-semibold">Odds</h2>
        <p className="mt-2 text-[var(--muted)]">
          History points: {market.history.length} · volume 24h{" "}
          <span className="font-mono tabular-nums">
            {market.volume_24h.toFixed(0)}
          </span>
        </p>
        <MarketChart />
      </section>

      <section className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-8">
        <h2 className="text-2xl font-semibold">Evidence</h2>
        <p className="mt-2 text-lg">
          Social{" "}
          <span className="font-mono tabular-nums">{evidence.social_score}</span>
          {" · "}
          Web{" "}
          <span className="font-mono tabular-nums">{evidence.web_score}</span>
          {" · "}
          {evidence.trend}
        </p>
        <p className="mt-2 text-[var(--muted)]">{evidence.show}</p>
        <EvidencePanel />
      </section>

      <section className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-8">
        <p className="font-mono text-sm tracking-[0.08em] uppercase text-[var(--muted)]">
          Why?
        </p>
        <h2 className="mt-2 text-3xl font-semibold">
          {rec.verdict === "diverged" ? "HIGH DIVERGENCE" : "ALIGNED"}{" "}
          {rec.divergence_score}
        </h2>
        <p className="mt-2 font-mono text-lg tabular-nums text-[var(--ink-2)]">
          {rec.suggested_side} · confidence {rec.confidence}
        </p>
        <p className="mt-6 max-w-3xl text-xl leading-relaxed">
          {rec.explanation}
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-lg text-[var(--ink-2)]">
          {rec.supporting_reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <div
          className="mt-8 rounded-[var(--r-sm)] p-6"
          style={{ background: "var(--inset)" }}
        >
          <p className="font-mono text-sm tracking-[0.08em] uppercase text-[var(--muted)]">
            Counterargument
          </p>
          <p className="mt-3 text-lg leading-relaxed">{rec.counterargument}</p>
        </div>
        <div className="mt-6">
          <p className="font-mono text-sm tracking-[0.08em] uppercase text-[var(--muted)]">
            Sources
          </p>
          {rec.sources.length === 0 ? (
            <p className="mt-2 text-[var(--muted)]">No sources in fixture.</p>
          ) : (
            <ul className="mt-2 list-disc pl-6 text-[var(--ink-2)]">
              {rec.sources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-6 font-mono text-sm text-[var(--muted)]">
          as of {rec.as_of} · week of {culture.week_of} ·{" "}
          {culture.official_rank[0]}
        </p>
      </section>

      <Link
        href={`#replay`}
        className="inline-flex w-fit rounded-[var(--r-sm)] px-5 py-3 text-lg font-medium text-[var(--ground)]"
        style={{ background: "var(--market)" }}
      >
        Replay Last Week
      </Link>

      <section id="replay">
        <Replay />
      </section>
    </main>
  );
}
