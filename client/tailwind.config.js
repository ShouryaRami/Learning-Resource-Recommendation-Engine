/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'umbc-black': '#000000',
        'umbc-gold': '#FFD700',
        'umbc-gray': '#666666',
        'umbc-surface': '#F9F9F9',
      },
    },
  },
  plugins: [],
}

