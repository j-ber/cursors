export type Market = {
  id: string;
  title: string;
  odds_by_show: Record<string, number>;
  history: { t: string; p: number }[];
  volume_24h: number;
  timestamp: string;
  source: string;
  clob_token_ids?: Record<string, string>;
  end_date?: string;
};

export type Evidence = {
  show: string;
  window_start: string;
  window_end: string;
  social_score: number;
  web_score: number;
  trend: "rising" | "flat" | "falling";
  top_sources: string[];
  snippets: Array<string | { text: string; source: string; date?: string }>;
  timestamp: string;
  source: string;
};

export type Culture = {
  week_of: string;
  official_rank: string[];
  views: number | null;
  previous_rank: string[] | null;
  source: string;
  as_of: string;
};

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
};
