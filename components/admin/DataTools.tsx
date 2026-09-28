'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DataTools() {
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [fileName, setFileName] = useState('');
  const [report, setReport] = useState<any>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');

  const onFile = async (f: File) => {
    setReport(null);
    setMsg('');
    setFileName(f.name);
    try {
      setDoc(JSON.parse(await f.text()));
    } catch {
      setDoc(null);
      setMsg('Файл не читается как JSON');
    }
  };

  const run = async (dry: boolean, ignoreErrors = false) => {
    if (!doc) return;
    setBusy(true);
    setMsg('');
    const r = await fetch('/api/admin/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ doc, dry, ignoreErrors, overwriteTests: overwrite }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setReport(d);
    if (!r.ok) setMsg(d.error ?? 'Ошибка');
    else if (!dry) { setMsg('Импорт выполнен'); router.refresh(); }
  };

  const build = async () => {
    setBusy(true);
    const r = await fetch('/api/admin/build-tests', { method: 'POST' });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? `Создано тестов: ${d.created} (вопросов в пуле: ${d.poolSize})` : d.error ?? 'Ошибка');
    if (r.ok) router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Импорт вопросов</h2>
        <p className="text-sm text-slate-400">
          Файл в формате <code className="text-brand-400">dgt-pwa/questions@1</code> (см. README). Вопросы с тем же <code>source</code> + <code>source_ref</code> обновляются, остальные добавляются.
          Без указанного статуса прав вопрос получает <b>unverified</b> и не показывается пользователям.
        </p>
        <input type="file" accept=".json,application/json" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} className="text-sm" data-testid="import-file" />
        {doc && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-400">{fileName}</span>
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(true)} data-testid="import-check">Проверить</button>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(false)} data-testid="import-run">Импортировать</button>
            <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> перезаписать состав уже заполненных тестов</label>
          </div>
        )}
        {report && (
          <pre className="max-h-64 overflow-auto rounded-xl bg-ink p-3 text-xs text-slate-300" data-testid="import-report">{JSON.stringify(report, null, 2)}</pre>
        )}
        {msg && <p className="text-sm text-amber-300" data-testid="data-msg">{msg}</p>}
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Экспорт (резервная копия)</h2>
        <p className="text-sm text-slate-400">Скачивает все вопросы, переводы и состав тестов одним файлом — им же можно восстановить базу.</p>
        <a href="/api/admin/export" className="btn btn-ghost btn-sm" data-testid="export-link">Скачать JSON</a>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Автосборка тестов</h2>
        <p className="text-sm text-slate-400">
          Достраивает недостающие тесты до 90 по 30 вопросов из доступных пользователям вопросов. Уже существующие тесты не меняются.
          Если вопросов меньше, чем 90×30, они повторяются между тестами (но не внутри одного).
        </p>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={build}>Собрать недостающие тесты</button>
      </section>
    </div>
  );
}
