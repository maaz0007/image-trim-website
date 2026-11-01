/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        text: {
          primary: '#201515',
          secondary: '#36342e',
          tertiary: '#605d52',
          inverse: '#fffefb',
        },
        surface: {
          base: '#000000',
          muted: '#f8f4f0',
          card: '#ffffff',
          darkCard: '#121212',
          darkMuted: '#1a1a1a',
        },
        zapier: {
          orange: '#ff4f00',
          hover: '#e04500',
          soft: 'rgba(255, 79, 0, 0.08)',
          border: 'rgba(255, 79, 0, 0.3)',
        },
        border: {
          token: 'rgba(32, 21, 21, 0.12)',
          subtle: 'rgba(32, 21, 21, 0.08)',
          strong: '#201515',
          dark: 'rgba(255, 255, 255, 0.14)',
        }
      },
      fontFamily: {
        primary: ['Inter', 'Inter Fallback', 'system-ui', 'ui-sans-serif', 'sans-serif'],
        head: ['Inter', 'Inter Fallback', 'system-ui', 'ui-sans-serif', 'sans-serif'],
        body: ['Inter', 'Inter Fallback', 'system-ui', 'ui-sans-serif', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        md: ['16px', { lineHeight: '24px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '26px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['28px', { lineHeight: '34px' }],
        '3xl': ['32px', { lineHeight: '38px' }],
        '4xl': ['40px', { lineHeight: '48px' }],
      },
      spacing: {
        '1': '4px',
        '2': '6px',
        '3': '8px',
        '4': '10px',
        '5': '12px',
        '6': '16px',
        '7': '20px',
        '8': '24px',
      },
      borderRadius: {
        xs: '4px',
        sm: '12px',
        md: '14px',
        lg: '18px',
        xl: '50px',
        full: '9999px',
      },
      boxShadow: {
        'token-1': 'rgb(32, 21, 21) 0px 0px 0px 1px',
        'token-1-dark': 'rgba(255, 255, 255, 0.15) 0px 0px 0px 1px',
        'token-card': '0 2px 8px rgba(32, 21, 21, 0.04), 0 0 0 1px rgba(32, 21, 21, 0.08)',
        'token-card-dark': '0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        'token-elevated': '0 8px 24px rgba(32, 21, 21, 0.08), 0 0 0 1px rgba(32, 21, 21, 0.08)',
        'token-focus': '0 0 0 2px #fffefb, 0 0 0 4px #ff4f00',
      },
      transitionDuration: {
        instant: '200ms',
        fast: '250ms',
      },
    },
  },
  plugins: [],
}
