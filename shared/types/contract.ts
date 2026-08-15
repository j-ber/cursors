/** P4 owns this file. Do not rename P1's `odds_by_outcome` — it is live on main. */

export type PricePoint = {
  t: string;
  p: number;
};

export type Market = {
  id: string;
  title: string;
  odds_by_outcome: Record<string, number>;
  history: PricePoint[];
  volume_24h: number;
  timestamp: string;
  source: "polymarket" | "fixture";
};

export const MARKET_KEYS = [
  "id",
  "title",
  "odds_by_outcome",
  "history",
  "volume_24h",
  "timestamp",
  "source",
] as const;

export type EvidenceSnippet = {
  text: string;
  source: string;
  date: string;
};

export type EvidenceTrend = "rising" | "flat" | "falling";

export type EvidenceSource =
  | "grok_search"
  | "grok_web_search"
  | "grok_reasoning"
  | "fixture";

export type Evidence = {
  show: string;
  window_start: string;
  window_end: string;
  social_score: number;
  web_score: number;
  trend: EvidenceTrend;
  top_sources: string[];
  snippets: EvidenceSnippet[];
  timestamp: string;
  source: EvidenceSource;
};

export const EVIDENCE_KEYS = [
  "show",
  "window_start",
  "window_end",
  "social_score",
  "web_score",
  "trend",
  "top_sources",
  "snippets",
  "timestamp",
  "source",
] as const;

export type Culture = {
  week_of: string;
  official_rank: string[];
  views: number | null;
  previous_rank: string[] | number | null;
  source: string;
  as_of: string;
  current_rank?: number;
  history?: { week_of: string; rank: number; views: number }[];
  score?: number;
};

export const CULTURE_KEYS = [
  "week_of",
  "official_rank",
  "views",
  "previous_rank",
  "source",
  "as_of",
] as const;

export type Recommendation = {
  market_id: string;
  as_of: string;
  verdict: "aligned" | "diverged";
  suggested_side: "YES" | "NO" | "WATCH";
  divergence_score: number;
  confidence: number;
  explanation: string;
  supporting_reasons: string[];
  counterargument: string;
  sources: string[];
  flagged: boolean;
  source?: "grok" | "fixture";
};

export const RECOMMENDATION_KEYS = [
  "market_id",
  "as_of",
  "verdict",
  "suggested_side",
  "divergence_score",
  "confidence",
  "explanation",
  "supporting_reasons",
  "counterargument",
  "sources",
  "flagged",
] as const;
