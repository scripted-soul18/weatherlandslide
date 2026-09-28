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
        risk: {
          low: '#10B981',       // Emerald green
          moderate: '#F59E0B',  // Amber yellow
          high: '#F97316',      // Orange
          veryhigh: '#EF4444',  // Crimson Red
        },
        slate: {
          850: '#151E2E',
          950: '#0B0F19',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-low': 'glowGreen 2s ease-in-out infinite alternate',
        'glow-high': 'glowRed 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glowGreen: {
          '0%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' },
        },
        glowRed: {
          '0%': { boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(239, 68, 68, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
