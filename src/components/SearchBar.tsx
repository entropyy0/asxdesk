"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SearchBarProps = {
  placeholder?: string;
};

export default function SearchBar({
  placeholder = "Search ASX ticker or company name"
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ticker = query.trim().split(" ")[0]?.toUpperCase();
    if (!ticker) return;
    router.push(`/asx/${ticker}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full flex-1 rounded-full border border-white/10 bg-ink-900/70 px-5 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-blue-500 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-glow transition hover:bg-blue-400"
      >
        Search
      </button>
    </form>
  );
}
