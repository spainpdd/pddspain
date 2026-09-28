import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#020617', 900: '#0b1220', 800: '#111a2e', 700: '#1a2540' },
        brand: { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
      },
      fontSize: { question: ['1.2rem', { lineHeight: '1.55' }] },
    },
  },
  plugins: [],
};
export default config;
