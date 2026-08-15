"use client";

type Point = { t: string; p: number };

type Props = {
  history: Point[];
  cutoff?: string;
  revealAfterCutoff?: boolean;
};

function ms(t: string) {
  return Date.parse(t);
}

function pct(p: number) {
  const rounded = Math.round(p * 100);
  if (p >= 0.99 && p < 1 && rounded === 100) return "99%";
  return `${rounded}%`;
}

export default function MarketChart({
  history,
  cutoff,
  revealAfterCutoff = true,
}: Props) {
  const cutoffMs = cutoff ? ms(cutoff) + 60_000 : null;
  const visible =
    cutoffMs !== null && !revealAfterCutoff
      ? history.filter((pt) => ms(pt.t) <= cutoffMs)
      : history;

  if (visible.length < 2) {
    return (
      <p className="text-sm text-[var(--muted)]">Not enough price history to chart.</p>
    );
  }

  const w = 800;
  const h = 280;
  const pad = { l: 16, r: 72, t: 28, b: 28 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const t0 = ms(visible[0].t);
  const t1 = ms(visible[visible.length - 1].t);
  const span = Math.max(t1 - t0, 1);

  const x = (t: string) => pad.l + ((ms(t) - t0) / span) * innerW;
  const y = (p: number) => pad.t + (1 - p) * innerH;

  const line = visible.map((pt, i) => `${i === 0 ? "M" : "L"} ${x(pt.t)} ${y(pt.p)}`).join(" ");
  const start = visible[0];
  const end = visible[visible.length - 1];
  const cutoffPoint =
    cutoffMs !== null
      ? [...visible].reverse().find((pt) => ms(pt.t) <= cutoffMs) ?? start
      : null;
  const cutoffX = cutoff ? x(cutoff) : null;

  const post =
    cutoffMs !== null && revealAfterCutoff
      ? visible.filter((pt) => ms(pt.t) >= cutoffMs - 60_000)
      : [];
  const postLine =
    post.length > 1
      ? post.map((pt, i) => `${i === 0 ? "M" : "L"} ${x(pt.t)} ${y(pt.p)}`).join(" ")
      : "";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Idaho Murders market probability over time"
      className="h-auto w-full"
    >
      <rect width={w} height={h} fill="var(--chart-bg)" rx="8" />
      {cutoffX !== null ? (
        <>
          <line
            x1={cutoffX}
            x2={cutoffX}
            y1={pad.t}
            y2={h - pad.b}
            stroke="var(--accent)"
            strokeDasharray="5 5"
            strokeWidth="1.5"
          />
          <text
            x={Math.min(cutoffX + 8, w - pad.r)}
            y={18}
            fill="var(--accent)"
            fontSize="11"
            fontFamily="var(--font-ibm-plex-mono), ui-monospace, monospace"
          >
            Water Cooler flag — Aug 6, 12:00 UTC
          </text>
        </>
      ) : null}
      <path d={line} fill="none" stroke="var(--ink-soft)" strokeWidth="2.5" />
      {postLine ? (
        <path d={postLine} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      ) : null}
      <text x={x(start.t)} y={y(start.p) - 8} fill="var(--ink)" fontSize="16" fontWeight="600">
        {pct(start.p)}
      </text>
      {cutoffPoint ? (
        <text
          x={x(cutoffPoint.t)}
          y={y(cutoffPoint.p) - 8}
          fill="var(--accent)"
          fontSize="16"
          fontWeight="700"
          textAnchor="middle"
        >
          {pct(cutoffPoint.p)}
        </text>
      ) : null}
      {revealAfterCutoff ? (
        <text
          x={x(end.t)}
          y={y(end.p) + 6}
          fill="var(--ink)"
          fontSize="16"
          fontWeight="600"
          textAnchor="end"
        >
          {pct(end.p)}
        </text>
      ) : null}
    </svg>
  );
}
