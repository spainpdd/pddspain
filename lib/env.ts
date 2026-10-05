/** Все настройки из окружения — в одном месте */

const bool = (v: string | undefined, def = false) =>
  v === undefined || v === '' ? def : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());

export const env = {
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  },
  get sessionSecret() {
    const s = process.env.SESSION_SECRET;
    if (!s || s.length < 16) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SESSION_SECRET не задан (минимум 16 символов)');
      }
      return 'dev-only-insecure-secret-change-me';
    }
    return s;
  },
  get botToken() {
    return process.env.TELEGRAM_BOT_TOKEN || '';
  },
  get botUsername() {
    return process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';
  },
  get botWebhookSecret() {
    return process.env.TELEGRAM_WEBHOOK_SECRET || '';
  },
  get adminTelegramIds(): number[] {
    return (process.env.ADMIN_TELEGRAM_IDS || '')
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  },
  /** Отдавать ли пользователям вопросы со статусом прав unverified (по умолчанию — нет) */
  get serveUnverified() {
    return bool(process.env.SERVE_UNVERIFIED_QUESTIONS, false);
  },
  /** Только для локального просмотра: все тесты открыты без прохождения по порядку */
  get unlockAllTests() {
    // в боевом режиме работает только вместе с локальной dev-базой (ALLOW_PGLITE_IN_PROD), т.е. не на реальном сайте
    return bool(process.env.UNLOCK_ALL_TESTS, false) && (process.env.NODE_ENV !== 'production' || bool(process.env.ALLOW_PGLITE_IN_PROD, false));
  },
  get devLogin() {
    return bool(process.env.ENABLE_DEV_LOGIN, false);
  },
  get stripeSecret() {
    return process.env.STRIPE_SECRET_KEY || '';
  },
  get stripeWebhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || '';
  },
  get cronSecret() {
    return process.env.CRON_SECRET || '';
  },
  get supabaseUrl() {
    return process.env.SUPABASE_URL || '';
  },
  get supabaseServiceKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  },
};
