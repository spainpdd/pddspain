import { env } from '@/lib/env';
import { processRobokassaResult } from '@/lib/robokassa-pay';
import { normalizeAlgo } from '@/lib/robokassa';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handle(params: URLSearchParams) {
  const r = await processRobokassaResult(params, { pass2: env.robokassaPass2, algo: normalizeAlgo(env.robokassaHash), testMode: env.robokassaTest });
  return new Response(r.body, { status: r.status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

// Метод (GET или POST) задаётся в кабинете Robokassa — поддерживаем оба
export const GET = (req: Request) => handle(new URL(req.url).searchParams);
export async function POST(req: Request) {
  return handle(new URLSearchParams(await req.text()));
}
