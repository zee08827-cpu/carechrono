/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          dark: '#0F4953',
          DEFAULT: '#0F4953',
          light: '#1B6A78',
          deep: '#093138'
        },
        mint: {
          DEFAULT: '#CBF5EF',
          light: '#E6FAF6',
          dark: '#9FE8DC'
        },
        coral: {
          DEFAULT: '#F98E6E',
          soft: '#FDBDAA',
          dark: '#E06B47',
          critical: '#C2410C'
        },
        pink: {
          soft: '#FFCFD2',
          DEFAULT: '#FFCFD2',
          accent: '#FFB8BC'
        },
        canvas: {
          DEFAULT: '#F9FCFB',
          card: '#FFFFFF',
          subtle: '#F1F7F6'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 8px 30px -4px rgba(15, 73, 83, 0.07)',
        'float': '0 12px 35px -6px rgba(15, 73, 83, 0.12)',
        'pill': '0 4px 14px 0 rgba(15, 73, 83, 0.08)'
      }
    },
  },
  plugins: [],
}
