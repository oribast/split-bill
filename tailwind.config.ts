import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Важно для переключения темы
  theme: {
    extend: {
      colors: {
        body: "var(--bg-body)",
        card: "var(--bg-card)",
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        muted: "var(--text-muted)",
        border: "var(--border-color)",
        input: "var(--input-bg)",
        accent: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-primary-hover)",
          danger: "var(--accent-danger)",
          dangerHover: "var(--accent-danger-hover)",
        },
        item: "var(--item-bg)",
        preview: "var(--preview-bg)",
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen",
          "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", "sans-serif"
        ],
      }
    },
  },
  plugins: [],
};
export default config;