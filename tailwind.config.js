/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts}",
  ],
  theme: {
    screens: {
      'sm': '600px',
      'md': '960px',
      'lg': '1280px',
      'xl': '1920px',
    },
    extend: {
      width: {
        fill: '-webkit-fill-available',
      },
      height: {
        fill: '-webkit-fill-available',
      },
    },
  },
  plugins: [],
}

