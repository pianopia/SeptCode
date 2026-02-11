import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f8fafc",
        panel: "#ffffff",
        ink: "#0f172a",
        subInk: "#475569",
        line: "#e2e8f0",
        accent: "#0f766e",
        accentHover: "#115e59"
      }
    }
  },
  plugins: []
};

export default config;
