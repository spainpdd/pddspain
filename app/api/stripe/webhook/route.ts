import { NextResponse } from 'next/server';
import { processStripeWebhook } from '@/lib/billing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const raw = await req.text(); // именно сырое тело — иначе подпись не сойдётся
  try {
    const r = await processStripeWebhook(raw, req.headers.get('stripe-signature'));
    return NextResponse.json({ received: true, granted: r.granted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'bad request' }, { status: 400 });
  }
}
