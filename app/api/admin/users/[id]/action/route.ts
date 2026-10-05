import { adminRoute } from '@/lib/admin-api';
import { fail, json, readJson } from '@/lib/api';
import {
  adminAddNote, adminBlock, adminClearCheckpoint, adminDeleteNote, adminEndAccess, adminGrantDays, adminSetAccessUntil, adminSetAdmin, adminSetTags,
} from '@/lib/repo/admin-users';
import { notifyGift } from '@/lib/bot';

export const dynamic = 'force-dynamic';

/**
 * Единая точка действий администратора над пользователем.
 * Тело: { type, ...параметры }. Все изменения попадают в журнал.
 */
export const POST = (req: Request, { params }: { params: { id: string } }) =>
  adminRoute({}, async (admin) => {
    const b = await readJson(req);
    if (!b || typeof b.type !== 'string') return fail(400, 'bad_request');
    const id = params.id;
    switch (b.type) {
      case 'grant': {
        const r = await adminGrantDays(admin, id, Number(b.days), b.reason);
        const notified = b.notify && Number(b.days) > 0 ? await notifyGift(r.telegramId, r.until) : false;
        return json({ ok: true, until: r.until, notified });
      }
      case 'set_until': {
        const r = await adminSetAccessUntil(admin, id, String(b.date ?? ''), b.reason);
        const notified = b.notify ? await notifyGift(r.telegramId, r.until) : false;
        return json({ ok: true, until: r.until, notified });
      }
      case 'end_access':
        await adminEndAccess(admin, id, b.reason);
        return json({ ok: true });
      case 'set_admin':
        await adminSetAdmin(admin, id, !!b.on);
        return json({ ok: true });
      case 'block':
        await adminBlock(admin, id, true, b.reason);
        return json({ ok: true });
      case 'unblock':
        await adminBlock(admin, id, false);
        return json({ ok: true });
      case 'check_clear':
        await adminClearCheckpoint(admin, id, Number(b.milestone));
        return json({ ok: true });
      case 'tags':
        return json({ ok: true, tags: await adminSetTags(admin, id, b.tags) });
      case 'note_add':
        await adminAddNote(admin, id, b.body);
        return json({ ok: true });
      case 'note_delete':
        await adminDeleteNote(admin, id, Number(b.noteId));
        return json({ ok: true });
      default:
        return fail(400, 'unknown_action');
    }
  });
