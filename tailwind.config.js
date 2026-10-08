/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Ledger / journal palette — a personal record-keeping app, not a SaaS dashboard.
        paper: {
          DEFAULT: '#F3F1EA',
          dim: '#EAE7DC',
        },
        ink: {
          DEFAULT: '#1F2A22',
          soft: '#4B564C',
          faint: '#8A9186',
        },
        moss: {
          50: '#EEF3ED',
          100: '#D7E3D3',
          300: '#8FAF87',
          500: '#4B7A4A',
          600: '#3B6339',
          700: '#2E4E2C',
        },
        amber: {
          100: '#F3E3C6',
          300: '#DCB273',
          500: '#B8823B',
          600: '#96692D',
        },
        clay: {
          100: '#F1DEDA',
          300: '#D9A398',
          500: '#B15E52',
        },
        line: '#D8D3C4',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
