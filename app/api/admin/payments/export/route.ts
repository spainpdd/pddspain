import { adminRoute } from '@/lib/admin-api';
import { exportPayments } from '@/lib/repo/admin-stats';
import { csvResponse, toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) =>
  adminRoute({ mutating: false }, async () => {
    const rows = await exportPayments(new URL(req.url).searchParams.get('filter') ?? '');
    const text = toCsv(
      [
        { key: 'src', title: 'Источник' }, { key: 'ref', title: 'Номер' }, { key: 'status', title: 'Статус' }, { key: 'is_test', title: 'Тест' },
        { key: 'amount', title: 'Сумма' }, { key: 'currency', title: 'Валюта' }, { key: 'shown_amount', title: 'Показано' }, { key: 'shown_currency', title: 'Валюта показа' },
        { key: 'fee', title: 'Комиссия' }, { key: 'payment_method', title: 'Способ' }, { key: 'days_granted', title: 'Дней' },
        { key: 'user_name', title: 'Пользователь' }, { key: 'telegram_username', title: 'Username' }, { key: 'user_id', title: 'ID пользователя' },
        { key: 'created_at', title: 'Создан' }, { key: 'paid_at', title: 'Оплачен' },
      ],
      rows as any,
    );
    return csvResponse(`payments-${new Date().toISOString().slice(0, 10)}.csv`, text);
  });
