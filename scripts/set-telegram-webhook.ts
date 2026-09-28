/**
 * Регистрирует вебхук бота и меню команд.
 *   npm run bot:webhook
 * Нужны: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL (https).
 */
import './_env';
import { env } from '../lib/env';
import { callTelegram } from '../lib/telegram';

(async () => {
  if (!env.botToken) throw new Error('TELEGRAM_BOT_TOKEN не задан');
  if (!env.botWebhookSecret) throw new Error('TELEGRAM_WEBHOOK_SECRET не задан (любая длинная случайная строка)');
  if (!env.siteUrl.startsWith('https://')) throw new Error('NEXT_PUBLIC_SITE_URL должен быть https-адресом сайта');
  const url = `${env.siteUrl}/api/telegram/webhook`;
  await callTelegram('setWebhook', { url, secret_token: env.botWebhookSecret, allowed_updates: ['message', 'callback_query'] });
  await callTelegram('setMyCommands', {
    commands: [
      { command: 'question', description: 'Вопрос дня' },
      { command: 'stats', description: 'Мои результаты' },
      { command: 'stop', description: 'Отключить рассылку' },
      { command: 'start', description: 'Включить рассылку' },
    ],
  });
  console.log('Вебхук установлен:', url);
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
