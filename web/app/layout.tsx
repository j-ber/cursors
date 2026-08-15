import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DRIFT",
  description: "AI prediction-market signal analyst",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--ground)] text-[var(--ink)]">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <header className="mb-12">
            <Link href="/" className="text-4xl font-semibold tracking-tight">
              DRIFT
            </Link>
            <p className="mt-2 text-lg text-[var(--muted)]">
              AI prediction-market signal analyst
            </p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
