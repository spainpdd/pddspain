import { env } from '@/lib/env';
import { processProdamusWebhook } from '@/lib/prodamus-pay';
import { nestPairs } from '@/lib/prodamus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Тело уведомления: x-www-form-urlencoded (обычно), multipart или JSON */
async function readBody(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    const j = await req.json().catch(() => null);
    return j && typeof j === 'object' && !Array.isArray(j) ? (j as Record<string, unknown>) : {};
  }
  if (type.includes('multipart/form-data')) {
    const f = await req.formData();
    return nestPairs([...f.entries()].filter((e): e is [string, string] => typeof e[1] === 'string'));
  }
  return nestPairs(new URLSearchParams(await req.text()).entries());
}

export async function POST(req: Request) {
  const sign = req.headers.get('sign') || '';
  const r = await processProdamusWebhook(await readBody(req), sign, {
    secrets: [env.prodamusSecret, env.prodamusWebhookSecret],
    testMode: env.prodamusTest,
  });
  if (r.status !== 200) console.error(`prodamus webhook: ${r.status} ${r.body}`);
  return new Response(r.body, { status: r.status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

// Prodamus при настройке иногда проверяет адрес GET-запросом
export const GET = () => new Response('ok', { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } });
