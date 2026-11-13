/** @type {import("tailwindcss").Config} */
import animate from 'tailwindcss-animate';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        ink: {
          900: "#0b1220",
          800: "#111827",
          700: "#1f2937",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["Sora", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px -12px rgb(15 23 42 / 0.12)",
        "card-hover": "0 12px 32px -16px rgb(15 23 42 / 0.18)",
        "glow-brand": "0 14px 36px -14px rgb(13 148 136 / 0.45)",
      },
      backgroundImage: {
        "grid-faint": "linear-gradient(to right, rgb(148 163 184 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [animate],
};
