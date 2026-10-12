import type { Config } from 'tailwindcss';

/**
 * Цвета берутся из CSS-переменных (см. app/globals.css): в светлой теме — как раньше, в тёмной (класс .dark на <html>) —
 * своя палитра. Поэтому слои вроде text-slate-500 или bg-ink-900 сами меняются в зависимости от темы.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
        },
        slate: {
        50: 'rgb(var(--slate-50) / <alpha-value>)',
        100: 'rgb(var(--slate-100) / <alpha-value>)',
        200: 'rgb(var(--slate-200) / <alpha-value>)',
        300: 'rgb(var(--slate-300) / <alpha-value>)',
        400: 'rgb(var(--slate-400) / <alpha-value>)',
        500: 'rgb(var(--slate-500) / <alpha-value>)',
        600: 'rgb(var(--slate-600) / <alpha-value>)',
        700: 'rgb(var(--slate-700) / <alpha-value>)',
        800: 'rgb(var(--slate-800) / <alpha-value>)',
        900: 'rgb(var(--slate-900) / <alpha-value>)',
        950: 'rgb(var(--slate-950) / <alpha-value>)',
        },
        brand: {
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
        },
      },
      fontSize: { question: ['1.2rem', { lineHeight: '1.55' }] },
    },
  },
  plugins: [],
};
export default config;
