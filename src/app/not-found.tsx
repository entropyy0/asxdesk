import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-blue-300">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-sm text-slate-400">
        We couldn't locate that ASX page. Try searching a ticker or visit the
        homepage.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-blue-500 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white"
      >
        Back to Home
      </Link>
    </div>
  );
}
