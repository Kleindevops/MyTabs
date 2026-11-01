/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./newtab.html",
    "./sidepanel.html",
    "./popup.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        itab: {
          bg: '#0f172a',
          glass: 'rgba(255, 255, 255, 0.15)',
          glassDark: 'rgba(15, 23, 42, 0.65)',
          border: 'rgba(255, 255, 255, 0.2)',
          borderDark: 'rgba(255, 255, 255, 0.08)',
        }
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
