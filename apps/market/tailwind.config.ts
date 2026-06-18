import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ray: {
          'surface-0': '#07080a',
          'surface-1': '#0d0d0d',
          'surface-2': '#101111',
          'surface-3': '#121212',
          'border': '#242728',
          'border-hover': '#35383a',
          'fg': '#ffffff',
          'fg-secondary': '#8b8d97',
          'fg-muted': '#4b4f57',
          'accent': '#ffffff',
          'official': '#5e77fe',
          'verified': '#30c88b',
          'community': '#8b8d97',
          'danger': '#ff5f57',
          'warning': '#febc2e',
          'success': '#28c840',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
