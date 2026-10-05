import Link from 'next/link';
import { overview } from '@/lib/repo/admin';
import { env } from '@/lib/env';

export default async function AdminHome() {
  const o = await overview();
  const cards: [string, number, string?, string?][] = [
    ['Пользователей', o.users],
    ['С активным доступом', o.paid_active],
    ['Оплат', o.payments],
    ['Вопросов', o.questions, '/admin/questions'],
    ['Права не подтверждены', o.unverified, '/admin/questions?rights=unverified', o.unverified ? 'text-amber-700' : ''],
    ['Нет перевода RU', o.no_ru, '/admin/questions?missing=ru'],
    ['Нет перевода HY', o.no_hy, '/admin/questions?missing=hy'],
    ['Тестов', o.tests, '/admin/tests'],
  ];
  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Обзор</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, value, href, tone]) => {
          const inner = (
            <div className="card p-4">
              <div className={`text-3xl font-bold ${tone ?? ''}`}>{value}</div>
              <div className="mt-1 text-xs text-slate-400">{label}</div>
            </div>
          );
          return href ? <Link key={label} href={href}>{inner}</Link> : <div key={label}>{inner}</div>;
        })}
      </div>
      <div className="card mt-6 p-4 text-sm text-slate-400">
        <p>Пользователям показываются вопросы: активные и со статусом прав <b>own / dgt_official / licensed</b>{env.serveUnverified ? <> и <b className="text-red-700">unverified</b> (включён переключатель)</> : ''}.</p>
        <p className="mt-2">Как менять вопросы постепенно: <Link href="/admin/questions" className="text-brand-400 underline">Вопросы</Link> → откройте нужный → правьте формулировку, варианты, перевод, картинку. Изменения сразу видны в тестах.</p>
      </div>
    </div>
  );
}
