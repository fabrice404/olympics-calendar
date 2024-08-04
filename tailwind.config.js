/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./docs/*.html"],
  theme: {
    extend: {
    },
  },
  plugins: [
    require("daisyui"),
  ],
  daisyui: {
    themes: ["cmyk"],
  },
};

