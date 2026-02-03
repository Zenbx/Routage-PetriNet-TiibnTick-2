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
        // Charte graphique TIIBNTICK
        background: "#1a1d2e",
        "background-light": "#252837",
        "background-card": "#2a2d3e",
        primary: "#ff6b35",
        "primary-dark": "#e65a2d",
        "primary-light": "#ff7f4f",
        text: {
          DEFAULT: "#ffffff",
          muted: "#9ca3af",
          dark: "#6b7280",
        },
        border: {
          DEFAULT: "#3a3d4e",
          light: "#4a4d5e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
