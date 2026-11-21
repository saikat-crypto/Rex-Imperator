/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--surface-card)',
          card: 'var(--surface-card)',
          subtle: 'var(--surface-card-subtle)',
          hover: 'var(--surface-hover)',
          active: 'var(--surface-active)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          onAccent: 'var(--text-on-accent)',
        },
        line: {
          subtle: 'var(--border-subtle)',
          medium: 'var(--border-medium)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          medium: 'var(--accent-medium)',
          glow: 'var(--accent-glow)',
        },
        // Backwards-compatible aliases
        burgundy: {
          DEFAULT: 'var(--accent-primary)',
          accent: 'var(--accent-primary)',
          deep: 'var(--accent-hover)',
          50: 'var(--accent-soft)',
          100: 'var(--accent-medium)',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        serif: [
          'Newsreader',
          'Playfair Display',
          'Merriweather',
          'Georgia',
          'serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'monospace',
        ],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)',
        'soft-md': '0 4px 12px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02)',
        'accent-glow': '0 0 20px -3px var(--accent-glow)',
      },
      animation: {
        'caret-pulse': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
