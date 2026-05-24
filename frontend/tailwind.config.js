/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vibe: {
          '950': '#0a0a0a', /* Modern Dark */
          '900': '#171717',
          '800': '#262626',
          primary: '#FF2A5F', /* Crimson Rose */
          accent: '#9D4EDD', /* Amethyst Purple */
          hdr: '#FAFAFA',
          muted: '#A3A3A3',
        }
      },
      boxShadow: {
        'hdr-orange': '0 8px 30px rgba(255, 42, 95, 0.25)', /* Crimson Glow Border */
        'hdr-neon': '0 0 20px rgba(157, 78, 221, 0.3)', /* Amethyst Glow */
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'neumorph-flat': '0 4px 12px rgba(0,0,0,0.5)',
      },
      animation: {
        'gradient-x': 'gradient-x 10s ease infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': 'left center' },
          '50%': { 'background-position': 'right center' },
        },
      }
    },
  },
  plugins: [],
}
