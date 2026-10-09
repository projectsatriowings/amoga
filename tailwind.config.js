/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amoga: {
          primary: '#287A25',
          botanical: '#557C36',
          gold: '#C5A46D',
          silver: '#C6C8CD',
          dark: '#0e0f12',
          light: '#FDFBF7',
        },
        food: {
          bg: '#F1EDE4',
          surface: '#F8F5EE',
          accent: '#287A25',
          botanical: '#557C36',
          text: '#172B1C',
          neutral: '#E5DFD3',
        },
        sarees: {
          bg: '#2C0E1A',
          burgundy: '#451523',
          gold: '#C5A46D',
          text: '#F6EBD8',
        },
        jewellery: {
          bg: '#111215',
          charcoal: '#1C1D20',
          silver: '#C6C8CD',
          text: '#F4F4F2',
        },
        theme: {
          bg: 'var(--bg-primary)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          text: 'var(--text-primary)',
          'text-sec': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
          accent: 'var(--accent-primary)',
          'accent-sec': 'var(--accent-secondary)',
          border: 'var(--border-subtle)',
          'border-strong': 'var(--border-strong)',
          ring: 'var(--focus-ring)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Garamond', 'serif'],
        jakarta: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        glow: 'var(--shadow-glow)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
        cinematic: 'var(--duration-cinematic)',
      },
      maxWidth: {
        prose: '65ch',
        container: '1280px',
        wide: '1440px',
      },
    },
  },
  plugins: [],
}
