/** Shared integration types. P4 owns this file; P3 needs Culture to ship Replay. */

export type PricePoint = { t: string; p: number };

export type Market = {
  id: string;
  title: string;
  yes_price?: number;
  no_price?: number;
  odds_by_outcome?: Record<string, number>;
  history: Array<PricePoint | { t: string; odds_by_outcome: Record<string, number> }>;
  volume_24h: number;
  timestamp: string;
};

export type Evidence = {
  show?: string;
  social_score?: number;
  web_score?: number;
  scores_by_outcome?: Record<string, number>;
  trend: string;
  top_sources?: string[];
  snippets: string[];
  sources?: string[];
  source?: string;
  timestamp: string;
  window_start?: string;
  window_end?: string;
};

export type RankHistoryPoint = {
  week_of: string;
  rank: number;
  views: number;
};

/** Ground truth for a Netflix Top 10 week (P3). Includes AGENTS.md `truth` fields. */
export type Culture = {
  week_of: string;
  official_rank: string[];
  source: "netflix_tudum" | "google_trends" | string;
  views: number;
  previous_rank: number;
  current_rank: number;
  history: RankHistoryPoint[];
  score: number;
  as_of: string;
};

export type Recommendation = {
  market_id?: string;
  as_of?: string;
  verdict: string;
  suggested_side?: string;
  divergence_score: number;
  confidence?: number;
  explanation: string;
  supporting_reasons?: string[];
  counterargument: string;
  sources: unknown[];
  flagged?: boolean;
};
