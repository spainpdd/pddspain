import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { adminRoute } from '@/lib/admin-api';
import { fail, json } from '@/lib/api';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/gif': 'gif' };
const MAX = 3 * 1024 * 1024;

/**
 * Загрузка картинки вопроса.
 *  • Если задан SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — кладём в публичный bucket Supabase Storage.
 *  • Иначе в разработке — в public/uploads (на Vercel запись на диск невозможна: вставляйте готовый URL).
 */
export const POST = (req: Request) =>
  adminRoute({}, async () => {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail(400, 'Файл не передан');
    const ext = TYPES[file.type];
    if (!ext) return fail(415, 'Допустимы PNG, JPG, WEBP, GIF, SVG');
    if (file.size > MAX) return fail(413, 'Файл больше 3 МБ');
    const buf = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    if (env.supabaseUrl && env.supabaseServiceKey) {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'question-images';
      const r = await fetch(`${env.supabaseUrl}/storage/v1/object/${bucket}/${name}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${env.supabaseServiceKey}`, 'content-type': file.type, 'x-upsert': 'true' },
        body: buf,
      });
      if (!r.ok) return fail(502, `Supabase Storage: ${(await r.text()).slice(0, 200)}`);
      return json({ url: `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${name}` });
    }
    if (process.env.NODE_ENV !== 'production') {
      const dir = path.join(process.cwd(), 'public', 'uploads');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), buf);
      return json({ url: `/uploads/${name}` });
    }
    return fail(501, 'Хранилище не настроено: задайте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY либо вставьте URL картинки вручную');
  });
