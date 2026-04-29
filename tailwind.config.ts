import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 既存の green スケールも残す（後方互換）
        green: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        // ▼ 新パレット（赤坂高級感 × 健康）
        forest: {
          900: "#0d2e22",
          800: "#133a2b",
          700: "#1a4f3a",
          600: "#2d6a4f",
          500: "#3f8d6e",
          400: "#6ba788",
        },
        gold: {
          700: "#8a6f30",
          600: "#a98948",
          500: "#c9a656",
          400: "#d8be7a",
          300: "#e8d4a0",
        },
        ivory: {
          50: "#faf6ec",
          100: "#f4ede0",
          200: "#e8dec9",
        },
        sumi: {
          900: "#1a1a18",
          700: "#3a3a36",
          500: "#6b6a64",
        },
        shu: {
          500: "#b53a2a",
        },
      },
      fontFamily: {
        mincho: ['"Shippori Mincho B1"', '"Noto Serif JP"', "serif"],
        cormorant: ['"Cormorant Garamond"', "serif"],
        sans: ["Inter", '"Noto Sans JP"', "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        shimmer: "shimmer 3s linear infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
