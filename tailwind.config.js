/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          bg: "#0d0221",
          text: "#7DF9FF",
          accent: "#ff0099",
        },
        studio: {
          bg: "#1E1E1E",
          text: "#FFD369",
          accent: "#FF8800",
        },
        forest: {
          bg: "#0b2812",
          text: "#b5f7c8",
          accent: "#2ecc71",
        },
      },
    },
  },
  plugins: [],
};
