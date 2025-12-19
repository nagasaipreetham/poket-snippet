/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#191919',
        sidebar: '#202020',
        surface: '#2F2F2F',
        'surface-hover': '#37352F',
        border: '#373737',
        text: '#D4D4D4',
        'text-muted': '#9B9B9B',
        accent: '#2383E2',
      },
      fontFamily: {
        sans: ['Geom', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
