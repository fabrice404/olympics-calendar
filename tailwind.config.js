/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./docs/**/*.html"],
  theme: {
    extend: {
      fontFamily: {
        gmono: ["'Anonymous'", "monospace"],
      },
    },
  },
  plugins: [],
};

