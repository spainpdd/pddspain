import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Светлая, «успокаивающая» тема: мягкий голубовато-серый фон, белые карточки.
        ink: { DEFAULT: '#eef2f9', 900: '#ffffff', 800: '#f3f6fb', 700: '#e6ebf3' },
        brand: { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
      },
      fontSize: { question: ['1.2rem', { lineHeight: '1.55' }] },
    },
  },
  plugins: [],
};
export default config;
