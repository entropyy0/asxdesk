import type { Metadata } from "next";
import Link from "next/link";
import { OrganizationSchema } from "@/components/SEO";

type UpcomingIPO = {
  company: string;
  ticker: string;
  expectedDate: string;
  offerPrice: string;
  industry: string;
  status: string;
};

type IPOLogEntry = {
  ticker: string;
  name: string;
  date_added: string;
  listing_date: string;
};

let upcomingIpos: UpcomingIPO[] = [];
try {
  upcomingIpos = require("@/data/upcoming_ipos.json");
} catch {
  upcomingIpos = [];
}

let ipoLog: IPOLogEntry[] = [];
try {
  ipoLog = require("@/data/ipo_log.json");
} catch {
  ipoLog = [];
}

// Get IPOs added in the last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const recentIPOs = ipoLog
  .filter((entry) => new Date(entry.date_added) >= thirtyDaysAgo)
  .sort(
    (a, b) =>
      new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
  );

export const metadata: Metadata = {
  title: "ASX IPOs & Upcoming Floats | New Listings Tracker",
  description:
    "Track upcoming ASX floats and recently listed IPOs. Stay ahead of new ASX listings with our comprehensive IPO tracker.",
  alternates: {
    canonical: "https://asxdesk.com/ipos"
  }
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateStr;
  }
}

export default function IPOsPage() {
  return (
    <div className="space-y-10">
      <OrganizationSchema />

      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-ink-800/60 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          IPO Tracker
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          ASX IPOs & Upcoming Floats
        </h1>
        <p className="mt-4 text-sm text-slate-300">
          Track upcoming ASX listings and recently floated companies. Updated
          daily from the ASX company directory.
        </p>
      </section>

      {/* Upcoming Floats */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Upcoming Floats
        </h2>
        {upcomingIpos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-6">
            <p className="text-sm text-slate-400">
              No upcoming floats currently listed on the ASX. Check back soon —
              new listings are typically announced 4–6 weeks before their float
              date.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-ink-800/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Expected Date</th>
                  <th className="px-4 py-3">Offer Price</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingIpos.map((ipo) => (
                  <tr
                    key={ipo.ticker}
                    className="border-b border-white/5 transition hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {ipo.company}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
                        {ipo.ticker}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatDate(ipo.expectedDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {ipo.offerPrice}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {ipo.industry}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-300">
                        {ipo.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-500">
          Source: ASX Upcoming Floats &amp; Listings. Dates are proposed and
          subject to change.
        </p>
      </section>

      {/* Recently Listed */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Recently Listed (Last 30 Days)
        </h2>
        {recentIPOs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-6">
            <p className="text-sm text-slate-400">
              No new IPOs detected in the last 30 days.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentIPOs.map((ipo) => (
              <Link
                key={ipo.ticker}
                href={`/asx/${ipo.ticker}`}
                className="group rounded-2xl border border-white/10 bg-ink-800/60 p-5 transition hover:-translate-y-1 hover:border-blue-500/40"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
                    {ipo.ticker}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(ipo.date_added)}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-white">
                  {ipo.name}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Listed {formatDate(ipo.listing_date)}
                </p>
                <div className="mt-3 text-xs text-blue-300">
                  View profile →
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Info section */}
      <section className="rounded-2xl border border-white/10 bg-ink-800/60 p-6">
        <h2 className="font-display text-lg font-semibold text-white">
          About ASX IPO Tracking
        </h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <p>
            Our IPO tracker monitors the ASX company directory daily to detect
            new listings as they appear. Upcoming floats are scraped directly
            from the ASX website, which typically lists companies 4–6 weeks
            before their expected listing date.
          </p>
          <p>
            When a new listing is detected, we automatically generate an
            AI-powered company profile including description, analysis, and key
            investment considerations.
          </p>
        </div>
      </section>
    </div>
  );
}
