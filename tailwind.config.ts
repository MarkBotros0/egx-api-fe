import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "charcoal-dark": "#0a0a0f",
        charcoal: "#12121a",
        gain: "#00ff88",
        loss: "#ff3355",
        accent: "#4488ff",
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
