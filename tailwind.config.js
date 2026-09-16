/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bengali: ['"Noto Sans Bengali"', 'SolaimanLipi', 'sans-serif'],
        sans: ['Inter', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
      },
      colors: {
        walton: {
          blue: '#005697',
          red: '#EE1D23',
          dark: '#0e1726',
        }
      }
    },
  },
  plugins: [],
}
