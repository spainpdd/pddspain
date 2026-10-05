import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import {
  deleteUsefulPage, deleteUsefulSection, moveUsefulPage, moveUsefulSection, saveUsefulPage, saveUsefulSection,
} from '@/lib/repo/useful';

export const dynamic = 'force-dynamic';

/**
 * Единая точка правок раздела «Полезно». Тело: { type, ... }
 *  save_page{page}, delete_page{id}, move_page{id,dir}, save_section{id?,title}, delete_section{id}, move_section{id,dir}
 */
export const POST = (req: Request) =>
  adminRoute({}, async (admin) => {
    const b = await readJson(req);
    if (!b || typeof b.type !== 'string') return fail(400, 'bad_request');
    const dir = b.dir === 'down' ? 'down' : 'up';
    switch (b.type) {
      case 'save_page':
        return json({ ok: true, ...(await saveUsefulPage(admin, b.page ?? {})) });
      case 'delete_page':
        await deleteUsefulPage(admin, String(b.id ?? ''));
        return json({ ok: true });
      case 'move_page':
        await moveUsefulPage(admin, String(b.id ?? ''), dir);
        return json({ ok: true });
      case 'save_section':
        return json({ ok: true, id: await saveUsefulSection(admin, { id: b.id, title: b.title }) });
      case 'delete_section':
        await deleteUsefulSection(admin, String(b.id ?? ''));
        return json({ ok: true });
      case 'move_section':
        await moveUsefulSection(admin, String(b.id ?? ''), dir);
        return json({ ok: true });
      default:
        return fail(400, 'unknown_action');
    }
  });
