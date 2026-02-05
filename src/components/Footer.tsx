import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-800/60">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <h3 className="font-display text-lg font-semibold">ASX Desk</h3>
          <p className="mt-3 text-sm text-slate-400">
            Automated ASX stock research with AI-generated analysis, sector trends,
            and data-backed screening tools.
          </p>
          <div className="mt-4 flex gap-3">
            <button className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              Open an Account
            </button>
            <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              Download Media Kit
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 text-sm text-slate-400">
          <div>
            <h4 className="mb-2 font-semibold text-slate-200">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/screener" className="hover:text-white">
                  Screener
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white">
                  News & Commentary
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-slate-200">Sectors</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/sectors/materials" className="hover:text-white">
                  Materials
                </Link>
              </li>
              <li>
                <Link href="/sectors/financials" className="hover:text-white">
                  Financials
                </Link>
              </li>
              <li>
                <Link href="/sectors/health care" className="hover:text-white">
                  Health Care
                </Link>
              </li>
              <li>
                <Link href="/sectors/information technology" className="hover:text-white">
                  Information Tech
                </Link>
              </li>
              <li>
                <Link href="/sectors/energy" className="hover:text-white">
                  Energy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h4 className="font-semibold">Weekly Alpha Briefing</h4>
          <p className="mt-2 text-sm text-slate-400">
            Get our AI-powered watchlist, sector heatmaps, and new ASX coverage in
            your inbox.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-full border border-white/10 bg-ink-900/60 px-4 py-2 text-sm text-white placeholder:text-slate-500"
            />
            <button className="rounded-full bg-blue-500 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              Subscribe
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            By subscribing you agree to receive marketing updates. Unsubscribe anytime.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <p>
          General advice only. This site does not consider your objectives, financial
          situation, or needs. Past performance is not indicative of future results.
        </p>
      </div>
    </footer>
  );
}
