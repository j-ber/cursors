import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Culture,
  Evidence,
  EvidenceSnippet,
  Market,
  Recommendation,
} from "../../shared/types/contract";
import { RECOMMENDATION_KEYS } from "../../shared/types/contract";
import { REPLAY_CUTOFF, REPLAY_SLUG, getMarket } from "./market";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = "grok-4.6";
const MODEL_FALLBACK = "grok-4-fast";

function fixturesDir() {
  const cwd = process.cwd();
  return cwd.endsWith("web")
    ? join(cwd, "../shared/fixtures")
    : join(cwd, "shared/fixtures");
}

export function loadRootEnv() {
  const roots = [
    join(process.cwd(), ".env.local"),
    join(process.cwd(), ".env"),
    join(process.cwd(), "../.env.local"),
    join(process.cwd(), "../.env"),
  ];
  for (const p of roots) {
    if (!existsSync(/* turbopackIgnore: true */ p)) continue;
    for (const line of readFileSync(/* turbopackIgnore: true */ p, "utf8").split(
      "\n",
    )) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]]) continue;
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "").trim();
    }
  }
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixturesDir(), name), "utf8")) as T;
}

function normalizeSnippets(raw: unknown, fallbackDate: string): EvidenceSnippet[] {
  if (!Array.isArray(raw)) return [];
  const out: EvidenceSnippet[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      if (item.includes("PLACEHOLDER")) continue;
      out.push({ text: item, source: "unknown", date: fallbackDate });
      continue;
    }
    const rec = item as { text?: string; source?: string; date?: string };
    const text = String(rec.text ?? "").trim();
    if (!text || text.includes("PLACEHOLDER")) continue;
    out.push({
      text,
      source: String(rec.source ?? "unknown"),
      date: String(rec.date ?? fallbackDate),
    });
  }
  return out;
}

export function loadEvidenceFixture(): Evidence {
  const raw = readJson<{
    show: string;
    window_start: string;
    window_end: string;
    social_score: number;
    web_score: number;
    trend: Evidence["trend"] | string;
    top_sources: string[];
    snippets: unknown;
    timestamp: string;
    source?: Evidence["source"];
  }>("evidence.json");
  const trend =
    raw.trend === "rising" || raw.trend === "flat" || raw.trend === "falling"
      ? raw.trend
      : "flat";
  return {
    show: raw.show,
    window_start: raw.window_start,
    window_end: raw.window_end,
    social_score: raw.social_score,
    web_score: raw.web_score,
    trend,
    top_sources: (raw.top_sources ?? []).filter(
      (s) => s && !s.includes("PLACEHOLDER"),
    ),
    snippets: normalizeSnippets(raw.snippets, raw.window_end),
    timestamp: raw.timestamp,
    source: "fixture",
  };
}

export function loadCultureFixture(): Culture {
  const raw = readJson<Culture>("netflix-week.json");
  return {
    week_of: raw.week_of,
    official_rank: raw.official_rank ?? [],
    views: raw.views ?? null,
    previous_rank: raw.previous_rank ?? null,
    source: raw.source,
    as_of: raw.as_of,
  };
}

export function loadRecommendationFixture(): Recommendation {
  const raw = readJson<Recommendation>("recommendation.json");
  return { ...raw, source: "fixture" };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = stripFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clamp(n: unknown, lo: number, hi: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter((s) => s && !s.includes("PLACEHOLDER"));
}

export function isRecommendation(v: unknown): v is Recommendation {
  if (!isRecord(v)) return false;
  return RECOMMENDATION_KEYS.every((k) => k in v);
}

function toRecommendation(
  raw: Record<string, unknown>,
  fallback: { market_id: string; as_of: string },
  source: "grok" | "fixture",
): Recommendation {
  const verdict = raw.verdict === "aligned" ? "aligned" : "diverged";
  const sideRaw = String(raw.suggested_side ?? "WATCH").toUpperCase();
  const suggested_side: Recommendation["suggested_side"] =
    sideRaw === "YES" || sideRaw === "NO" || sideRaw === "WATCH"
      ? sideRaw
      : "WATCH";
  const explanation = String(raw.explanation ?? "").trim();
  const counterargument = String(raw.counterargument ?? "").trim();
  if (!explanation || explanation.includes("PLACEHOLDER")) {
    throw new Error("empty or placeholder explanation");
  }
  if (!counterargument || counterargument.includes("PLACEHOLDER")) {
    throw new Error("empty or placeholder counterargument");
  }
  return {
    market_id: String(raw.market_id ?? fallback.market_id),
    as_of: String(raw.as_of ?? fallback.as_of),
    verdict,
    suggested_side,
    divergence_score: clamp(raw.divergence_score, 0, 100),
    confidence: clamp(raw.confidence, 0, 100),
    explanation,
    supporting_reasons: asStringArray(raw.supporting_reasons),
    counterargument,
    sources: asStringArray(raw.sources),
    flagged: Boolean(raw.flagged) || verdict === "diverged",
    source,
  };
}

function redactCulture(culture: Culture, asOf?: string): Culture {
  if (!asOf) return culture;
  if (!culture.as_of || Date.parse(culture.as_of) <= Date.parse(asOf)) {
    return culture;
  }
  return {
    ...culture,
    official_rank: [],
    views: null,
    previous_rank: null,
  };
}

const RECOMMENDATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
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
  ],
  properties: {
    market_id: { type: "string" },
    as_of: { type: "string" },
    verdict: { type: "string", enum: ["aligned", "diverged"] },
    suggested_side: { type: "string", enum: ["YES", "NO", "WATCH"] },
    divergence_score: { type: "number", minimum: 0, maximum: 100 },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    explanation: { type: "string" },
    supporting_reasons: { type: "array", items: { type: "string" } },
    counterargument: { type: "string" },
    sources: { type: "array", items: { type: "string" } },
    flagged: { type: "boolean" },
  },
} as const;

function systemPrompt(asOf?: string): string {
  const asOfRule = asOf
    ? `You are living at ${asOf}. You MUST reason only from the supplied payloads. Forbidden: any knowledge, news, rankings, or prices after that timestamp. If culture.official_rank is empty, the official outcome is not yet known — do not guess it from memory.`
    : "Use only the supplied payloads. Do not invent prices, snippets, or rankings that are not present.";

  return [
    "You are a prediction-market signal analyst for Drift.",
    "You compare market pricing against external evidence (social/web) and an official/historical culture source.",
    "Your job is to identify alignment vs an evidence gap — a divergence between what the market is pricing and what public evidence supports.",
    asOfRule,
    "Return strict JSON matching the Recommendation schema.",
    "Vocabulary: only 'divergence', 'evidence gap', and 'suggested side'. Never say manipulation, guaranteed, or that the market is wrong.",
    "Weigh the three inputs. Do not rubber-stamp a side.",
    "ALWAYS include a genuine counterargument — the strongest case that the gap is noise or that the market is already pricing the evidence.",
    "suggested_side is YES if evidence supports the leading/named show more than the market price, NO if evidence is weaker than the price, WATCH if the gap is thin or mixed.",
    "flagged is true when the evidence gap is large enough to surface on the feed.",
    "counterargument must be a real opposing case, never the word PLACEHOLDER.",
  ].join(" ");
}

async function callGrok(
  apiKey: string,
  model: string,
  market: Market,
  evidence: Evidence,
  culture: Culture,
  asOf?: string,
): Promise<Recommendation> {
  const user = JSON.stringify({
    as_of: asOf ?? market.timestamp,
    market: {
      id: market.id,
      title: market.title,
      odds_by_outcome: market.odds_by_outcome,
      volume_24h: market.volume_24h,
      timestamp: market.timestamp,
      last_history: market.history.slice(-8),
    },
    evidence: {
      show: evidence.show,
      window_start: evidence.window_start,
      window_end: evidence.window_end,
      social_score: evidence.social_score,
      web_score: evidence.web_score,
      trend: evidence.trend,
      top_sources: evidence.top_sources,
      snippets: evidence.snippets.slice(0, 8),
    },
    culture,
  });

  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt(asOf) },
        {
          role: "user",
          content: `Compare these three inputs and return the Recommendation JSON.\n${user}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendation",
          schema: RECOMMENDATION_SCHEMA,
          strict: true,
        },
      },
    }),
    cache: "no-store",
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`${model} ${res.status} ${bodyText.slice(0, 280)}`);
  }
  const body = JSON.parse(bodyText) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonObject(content);
  if (!parsed) throw new Error(`${model} did not return JSON`);
  return toRecommendation(
    parsed,
    { market_id: market.id, as_of: asOf ?? market.timestamp },
    "grok",
  );
}

export async function correlate(
  market: Market,
  evidence: Evidence,
  culture: Culture,
  asOf?: string,
): Promise<Recommendation> {
  loadRootEnv();
  const safeCulture = redactCulture(culture, asOf);
  const fixture = loadRecommendationFixture();
  const useFixture =
    process.env.USE_DEMO_FIXTURES === "true" || !process.env.XAI_API_KEY?.trim();

  if (useFixture) {
    return {
      ...fixture,
      market_id: market.id,
      as_of: asOf ?? fixture.as_of,
      source: "fixture",
    };
  }

  const apiKey = process.env.XAI_API_KEY!.trim();
  try {
    return await callGrok(apiKey, MODEL, market, evidence, safeCulture, asOf);
  } catch {
    try {
      return await callGrok(
        apiKey,
        MODEL_FALLBACK,
        market,
        evidence,
        safeCulture,
        asOf,
      );
    } catch {
      return {
        ...fixture,
        market_id: market.id,
        as_of: asOf ?? fixture.as_of,
        source: "fixture",
      };
    }
  }
}

export async function correlateForSlug(
  slug: string,
  asOf?: string,
): Promise<Recommendation> {
  const cutoff = asOf ?? (slug === REPLAY_SLUG ? REPLAY_CUTOFF : undefined);
  const market = await getMarket(slug, cutoff);
  const evidence = loadEvidenceFixture();
  const culture = loadCultureFixture();
  return correlate(market, evidence, culture, cutoff);
}
