export default function BrokerCTA() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display text-lg font-semibold">Compare ASX Brokers</h3>
      <p className="mt-2 text-sm text-slate-400">
        Find the best trading platform for your needs. We review fees, features,
        and research tools.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { name: "AlphaTrade", highlight: "$0 brokerage on ETFs" },
          { name: "MarketPilot", highlight: "Advanced research suite" },
          { name: "Coastline", highlight: "Low FX fees" },
          { name: "Harbour", highlight: "Pro-level charting" }
        ].map((broker) => (
          <div
            key={broker.name}
            className="rounded-xl border border-white/10 bg-ink-900/40 p-4"
          >
            <p className="text-sm font-semibold text-white">{broker.name}</p>
            <p className="text-xs text-slate-400">{broker.highlight}</p>
            <button className="mt-3 w-full rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              Open an Account
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Sponsored links. We may receive compensation if you open an account.
      </p>
    </div>
  );
}
