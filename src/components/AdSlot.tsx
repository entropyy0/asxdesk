export default function AdSlot({ slot = "default", className = "" }: { slot?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-ink-900/30 p-4 text-xs text-slate-500 ${className}`}>
      {/* Replace with Google AdSense code when approved */}
      {/* <ins className="adsbygoogle" data-ad-client="ca-pub-XXXXX" data-ad-slot={slot}></ins> */}
      <span>Advertisement</span>
    </div>
  );
}
