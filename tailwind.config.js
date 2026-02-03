/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-blue': '#3148B9',
        'brand-orange': '#F24C03',
        'dark-blue': '#0B1828',
        'brand-grey': '#232323',
        'blue-black': '#020409',
        bluestar: {
          50: '#e8ecf8',
          100: '#c5cdef',
          200: '#9faee5',
          300: '#7990db',
          400: '#5372d1',
          500: '#3148B9', // Space Blue - Primary
          600: '#2a3d9a',
          700: '#23327b',
          800: '#1c285c',
          900: '#0B1828', // Dark Blue
          950: '#020409', // Blue Black
        },
        accent: {
          orange: '#F24C03', // Brand Orange
          'orange-light': '#FF6B2C',
          'orange-dark': '#CC3F00',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'], // Body Text
        display: ['Raleway', 'system-ui', 'sans-serif'], // Headlines
        heading: ['Raleway', 'system-ui', 'sans-serif'], // Sub Headlines
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(49, 72, 185, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(49, 72, 185, 0.6)' },
        },
      },
      backgroundImage: {
        'gradient-1': 'linear-gradient(to bottom right, #0B1828, #3148B9)',
        'gradient-2': 'linear-gradient(to bottom right, #F24C03, #3148B9)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, rgba(49,72,185,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(242,76,3,0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(49,72,185,0.1) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
}
