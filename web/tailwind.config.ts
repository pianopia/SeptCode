import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0b1220",
        panel: "#111a2b",
        ink: "#e6edf8",
        accent: "#22c55e",
        accent2: "#38bdf8"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Noto Sans JP", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        display: ["var(--font-display)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
