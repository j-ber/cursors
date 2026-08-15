import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Culture,
  Evidence,
  Market,
  Recommendation,
} from "../../shared/types/contract";

export const LIVE_MARKET_ID =
  "what-will-be-the-top-us-netflix-show-this-week-20260812180419528";
export const REPLAY_MARKET_ID =
  "what-will-be-the-top-us-netflix-show-this-week-20260805154446618";

const fixturesDir = join(process.cwd(), "..", "shared", "fixtures");

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8")) as T;
}

type LiveMarketFixture = {
  id: string;
  title: string;
  odds_by_show: Record<string, number>;
  clob_token_ids?: Record<string, string>;
  volume_24h: number;
  end_date?: string;
  timestamp: string;
  source: string;
  history?: { t: string; p: number }[];
};

type ReplayMarketFixture = {
  id: string;
  title: string;
  winner: string;
  idaho_price_history: { t: string; p: number }[];
  as_of_cutoff_demo: string;
  price_at_cutoff: number;
  source: string;
  end_date?: string;
};

export function loadLiveMarket(): Market {
  const raw = loadJson<LiveMarketFixture>("live-market.json");
  return {
    id: raw.id,
    title: raw.title,
    odds_by_show: raw.odds_by_show,
    history: raw.history ?? [],
    volume_24h: raw.volume_24h,
    timestamp: raw.timestamp,
    source: raw.source,
    clob_token_ids: raw.clob_token_ids,
    end_date: raw.end_date,
  };
}

export function loadReplayMarket(): Market {
  const raw = loadJson<ReplayMarketFixture>("replay-market.json");
  return {
    id: raw.id,
    title: raw.title,
    odds_by_show: { [raw.winner]: raw.price_at_cutoff },
    history: raw.idaho_price_history,
    volume_24h: 0,
    timestamp: raw.as_of_cutoff_demo,
    source: raw.source,
    end_date: raw.end_date,
  };
}

export function loadEvidence(): Evidence {
  return loadJson<Evidence>("evidence.json");
}

export function loadCulture(): Culture {
  return loadJson<Culture>("netflix-week.json");
}

export function loadRecommendation(): Recommendation {
  return loadJson<Recommendation>("recommendation.json");
}

export function loadMarketBySlug(slug: string): Market | null {
  if (slug === LIVE_MARKET_ID) return loadLiveMarket();
  if (slug === REPLAY_MARKET_ID) return loadReplayMarket();
  return null;
}

export function leadingShow(odds: Record<string, number>): {
  show: string;
  p: number;
} {
  const entry = Object.entries(odds).sort((a, b) => b[1] - a[1])[0];
  return { show: entry?.[0] ?? "", p: entry?.[1] ?? 0 };
}

export function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}
