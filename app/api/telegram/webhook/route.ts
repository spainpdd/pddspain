import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { handleUpdate } from '@/lib/bot';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  // Telegram присылает секрет из setWebhook в этом заголовке
  if (!env.botWebhookSecret || req.headers.get('x-telegram-bot-api-secret-token') !== env.botWebhookSecret) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const update = await req.json().catch(() => null);
  try {
    if (update) await handleUpdate(update);
  } catch (e) {
    console.error('telegram webhook error', e);
  }
  return NextResponse.json({ ok: true }); // всегда 200, иначе Telegram будет повторять обновление
}
