import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#0B1220",
          800: "#0F172A",
          700: "#111827",
          600: "#1F2937"
        }
      },
      fontFamily: {
        sans: ["var(--font-plex)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-space)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(59, 130, 246, 0.2)",
        glass: "0 12px 32px rgba(15, 23, 42, 0.35)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top, rgba(59,130,246,0.25), transparent 55%), linear-gradient(120deg, rgba(15,23,42,0.9), rgba(2,6,23,0.95))"
      }
    }
  },
  plugins: []
};

export default config;
