import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">
        Drift
      </p>
      <h1 className="font-display text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
        Is the market pricing Netflix’s #1 correctly?
      </h1>
      <p className="max-w-xl text-lg text-[var(--ink-soft)]">
        Replay last week: 48% at the Thursday cutoff, a divergence flag, then the
        official Top 10 reveal.
      </p>
      <Link
        href="/replay"
        className="inline-flex w-fit rounded-md bg-[var(--accent)] px-5 py-3 font-mono text-sm font-semibold text-[#1a1404]"
      >
        Replay Last Week
      </Link>
    </main>
  );
}
