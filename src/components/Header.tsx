import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/screener", label: "Screener" },
  { href: "/sectors/materials", label: "Sectors" },
  { href: "/news", label: "News" },
  { href: "/compare/BHP-vs-RIO", label: "Compare" },
  { href: "/about", label: "About" }
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink-800/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight">
            ASX <span className="text-blue-400">Desk</span>
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-slate-400 sm:inline">
            Research Terminal
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <button className="rounded-full border border-blue-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-200 shadow-glow transition hover:bg-blue-500/20">
            Premium Research
          </button>
          <button className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-glow transition hover:bg-blue-400">
            Open Account
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-xs text-slate-400 md:hidden">
        <span>AI market insights for ASX investors</span>
        <Link href="/screener" className="text-blue-300">
          Screener
        </Link>
      </div>
    </header>
  );
}
