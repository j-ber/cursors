import { RECOMMENDATION_KEYS, type Recommendation } from "../../../shared/types/contract";
import {
  correlate,
  isRecommendation,
  loadCultureFixture,
  loadEvidenceFixture,
  loadRecommendationFixture,
} from "../correlator";
import { REPLAY_CUTOFF, REPLAY_SLUG, getMarket } from "../market";

const LIVE_SLUG =
  "what-will-be-the-top-us-netflix-show-this-week-20260812180419528";

function fail(msg: string): never {
  console.log(`FAIL ${msg}`);
  process.exit(1);
}

async function main() {
  const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  const market = await getMarket(REPLAY_SLUG, REPLAY_CUTOFF);
  const evidence = loadEvidenceFixture();
  const culture = loadCultureFixture();
  const rec = await correlate(market, evidence, culture, REPLAY_CUTOFF);

  if (!isRecommendation(rec)) fail("correlate() missing Recommendation keys");
  const missing = RECOMMENDATION_KEYS.filter((k) => !(k in rec));
  if (missing.length) fail(`keys ${missing.join(",")}`);
  if (rec.counterargument.includes("PLACEHOLDER")) {
    fail("counterargument is PLACEHOLDER");
  }
  if (rec.explanation.includes("PLACEHOLDER")) {
    fail("explanation is PLACEHOLDER");
  }
  console.log(
    `PASS correlate() ${rec.verdict} score=${rec.divergence_score} source=${rec.source}`,
  );

  const fixture = loadRecommendationFixture();
  if (fixture.counterargument.includes("PLACEHOLDER")) {
    fail("recommendation.json counterargument is PLACEHOLDER");
  }
  console.log("PASS recommendation.json has a real counterargument");

  if (!process.env.BASE_URL) {
    console.log("SKIP HTTP checks (set BASE_URL to hit a running server)");
    console.log("ALL PASS");
    return;
  }

  for (const path of [`/`, `/market/${LIVE_SLUG}`, `/market/${REPLAY_SLUG}`]) {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) fail(`GET ${path} → ${res.status}`);
    console.log(`PASS GET ${path} ${res.status}`);
  }

  const post = await fetch(`${base}/api/correlate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      market,
      evidence,
      culture,
      asOf: REPLAY_CUTOFF,
    }),
  });
  if (!post.ok) fail(`POST /api/correlate → ${post.status}`);
  const body = (await post.json()) as Recommendation;
  if (!isRecommendation(body)) fail("POST body is not Recommendation");
  if (body.counterargument.includes("PLACEHOLDER")) {
    fail("POST counterargument is PLACEHOLDER");
  }
  console.log(`PASS POST /api/correlate ${body.verdict} source=${body.source}`);

  const asof = await fetch(`${base}/api/correlate?mode=asof`);
  if (!asof.ok) fail(`GET mode=asof → ${asof.status}`);
  console.log("PASS GET /api/correlate?mode=asof");
  console.log("ALL PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
