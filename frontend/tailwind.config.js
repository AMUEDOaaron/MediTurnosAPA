/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1a7a4c',
          greenDark: '#145c3a',
          greenLight: '#e8f5ee',
          greenMid: '#d1e7dd',
          soft: '#f0faf4',
          border: '#b7d4c4',
          text: '#1a2e22',
          textSoft: '#5a6b60',
        }
      }
    },
  },
  plugins: [],
}