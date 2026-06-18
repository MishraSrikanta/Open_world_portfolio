import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // `game` kept as an alias (used throughout) → now maps to the body sans
        game: ["var(--font-sans)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // modern minimal dark palette
        ink: {
          950: "#08080a",
          900: "#0c0c0f",
          800: "#141418",
          700: "#1d1d22",
          600: "#2a2a31",
        },
        accent: {
          DEFAULT: "#67e8f9", // cyan
          soft: "#a5f3fc",
          violet: "#a78bfa",
        },
        cozy: {
          sky: "#9fd6ff",
          grass: "#7ec850",
          sand: "#e9d8a6",
          wood: "#a86b3c",
          night: "#0b1026",
        },
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
