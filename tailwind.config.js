/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        steel: "#475569",
        mist: "#eef2f7",
        teal: "#0f766e",
        amber: "#b45309",
        coral: "#be123c",
        // Scottish Government design system
        sg: "#0065BD",
        "sg-hover": "#004F99",
        "sg-light": "#EBF3FB",
        "sg-surface": "#F8F8F8",
        "sg-text": "#1D1D1B",
        "sg-success": "#5EB135",
        "sg-warn": "#E8850C",
        "sg-danger": "#D32205",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 42, 0.08)",
        card: "0 2px 8px rgba(0, 101, 189, 0.08)",
      },
    },
  },
  plugins: [],
};

