import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { sendUsefulDigest } from '@/lib/bot';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Рассылка материалов «Полезно» (вторник и пятница, см. vercel.json). Заголовок Authorization: Bearer $CRON_SECRET */
export async function GET(req: Request) {
  if (!env.cronSecret || req.headers.get('authorization') !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!env.botToken) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не задан' }, { status: 503 });
  return NextResponse.json(await sendUsefulDigest());
}
