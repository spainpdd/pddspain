import { adminRoute } from '@/lib/admin-api';
import { exportUsers } from '@/lib/repo/admin-users';
import { csvResponse, toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) =>
  adminRoute({ mutating: false }, async () => {
    const sp = new URL(req.url).searchParams;
    const rows = await exportUsers({ q: sp.get('q') ?? '', filter: sp.get('filter') ?? '', tag: sp.get('tag') ?? '', sort: sp.get('sort') ?? '', dir: sp.get('dir') ?? '' });
    const text = toCsv(
      [
        { key: 'id', title: 'ID' }, { key: 'display_name', title: 'Имя' }, { key: 'telegram_username', title: 'Username' },
        { key: 'telegram_id', title: 'Telegram ID' }, { key: 'created_at', title: 'Регистрация' }, { key: 'last_seen_at', title: 'Последний визит' },
        { key: 'access_until', title: 'Доступ до' }, { key: 'payments_count', title: 'Платежей' }, { key: 'answers', title: 'Ответов' },
        { key: 'tests_passed', title: 'Тестов сдано' }, { key: 'errors_open', title: 'Открытых ошибок' }, { key: 'study_lang', title: 'Язык теста' },
        { key: 'trans_lang', title: 'Язык перевода' }, { key: 'is_admin', title: 'Админ' }, { key: 'blocked_at', title: 'Заблокирован' }, { key: 'tags', title: 'Теги' },
      ],
      rows.map((r) => ({ ...r, tags: r.tags.join(', ') })) as any,
    );
    return csvResponse(`users-${new Date().toISOString().slice(0, 10)}.csv`, text);
  });
