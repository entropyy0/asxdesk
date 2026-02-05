import type { Stock } from "@/types";

export default function AnalysisSection({ stock }: { stock: Stock }) {
  return (
    <section className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold">AI Analysis</h2>
        <div className="mt-4 space-y-4 text-sm text-slate-300">
          {stock.analysis.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            Bull Case
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {stock.bullCase.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-300">
            Bear Case
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {stock.bearCase.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
