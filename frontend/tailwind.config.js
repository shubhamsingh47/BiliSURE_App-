/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0b192c',
          navyDark: '#070f1b',
          navySurface: '#12233c',
          navyBorder: '#1e385c',
          blue: '#1d68bd',
          blueHover: '#165296',
          lightBg: '#f4f7fb',
          card: '#ffffff',
          border: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
};
