import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gauntlet",
  description: "AI security release gate",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-neutral-900">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <Link href="/" className="font-bold tracking-tight">Gauntlet</Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
