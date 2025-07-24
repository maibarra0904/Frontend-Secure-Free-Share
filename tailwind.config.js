/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#007bff',
        'dark-navy': '#2c3e50',
        'accent-yellow': '#f7d000',
        'whatsapp-green': '#25d366',
        'gmail-red': '#d44638'
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.1' },
          '50%': { opacity: '0.05' },
        }
      },
      animation: {
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
