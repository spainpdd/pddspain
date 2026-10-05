'use client';

/**
 * Редактор материала «Полезно»: мета-данные, блоки (ru/hy) и живой предпросмотр так, как увидит пользователь.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BLOCK_TYPES, cleanBlocks, slugify, type Block, type BlockType, type ULang } from '@/lib/useful';
import type { AdminPage, AdminSection } from '@/lib/repo/useful';
import Blocks from '@/components/useful/Blocks';
import { cn } from '@/lib/utils';

type Draft = { _k: string; type: BlockType; [key: string]: any };

let seq = 0;
const uid = () => `b${++seq}-${Math.random().toString(36).slice(2, 7)}`;
const withKey = (b: Block): Draft => ({ ...(b as any), _k: uid() });
const strip = (d: Draft): Record<string, unknown> => {
  const { _k, ...rest } = d;
  return rest;
};

function blank(type: BlockType): Draft {
  const base: Record<BlockType, object> = {
    text: { text: '' },
    image: { url: '', caption: '' },
    video: { url: '', caption: '' },
    callout: { tone: 'info', text: '' },
    steps: { title: '', items: [{ title: '', text: '' }] },
    checklist: { title: '', items: [''] },
    table: { headers: ['', ''], rows: [['', '']] },
    faq: { items: [{ q: '', a: '' }] },
    link: { label: '', url: '', description: '' },
    divider: {},
  };
  return { _k: uid(), type, ...base[type] } as Draft;
}

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

const EMOJI = ['🩺', '📝', '🚗', '🌍', '📄', '🎓', '💶', '📍', '⚠️', '📞', '🏛️', '🎥'];

interface Form {
  slug: string;
  icon: string;
  status: 'draft' | 'published';
  section_id: string;
  title: Record<ULang, string>;
  summary: Record<ULang, string>;
  blocks: Record<ULang, Draft[]>;
}

function initial(p: AdminPage | null): Form {
  return {
    slug: p?.slug ?? '',
    icon: p?.icon ?? '',
    status: p?.status ?? 'draft',
    section_id: p?.section_id ?? '',
    title: { ru: p?.title.ru ?? '', hy: p?.title.hy ?? '' },
    summary: { ru: p?.summary.ru ?? '', hy: p?.summary.hy ?? '' },
    blocks: { ru: (p?.blocks.ru ?? []).map(withKey), hy: (p?.blocks.hy ?? []).map(withKey) },
  };
}

const snap = (f: Form) => JSON.stringify({ ...f, blocks: { ru: f.blocks.ru.map(strip), hy: f.blocks.hy.map(strip) } });

async function upload(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Ошибка ${r.status}`);
  return d.url as string;
}

export default function UsefulEditor({ page, sections }: { page: AdminPage | null; sections: AdminSection[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(() => initial(page));
  const [lang, setLang] = useState<ULang>('ru');
  const [id, setId] = useState<string | null>(page?.id ?? null);
  const [saved, setSaved] = useState(() => snap(initial(page)));
  const [slugTouched, setSlugTouched] = useState(!!page);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [adding, setAdding] = useState(false);
  const dirty = snap(form) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));
  const setBlocks = (b: Draft[]) => setForm((f) => ({ ...f, blocks: { ...f.blocks, [lang]: b } }));
  const blocks = form.blocks[lang];

  const setTitle = (v: string) =>
    setForm((f) => ({ ...f, title: { ...f.title, [lang]: v }, slug: !slugTouched && lang === 'ru' ? slugify(v) : f.slug }));

  async function save(status?: 'draft' | 'published') {
    setBusy(true);
    setMsg(null);
    const next = { ...form, status: status ?? form.status };
    const body = {
      type: 'save_page',
      page: {
        id: id ?? undefined,
        // у существующего материала адрес отправляем только если он есть в поле
        slug: next.slug || undefined,
        icon: next.icon,
        status: next.status,
        section_id: next.section_id || null,
        title: next.title,
        summary: next.summary,
        blocks: { ru: next.blocks.ru.map(strip), hy: next.blocks.hy.map(strip) },
      },
    };
    const r = await fetch('/api/admin/useful', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) {
      setMsg({ ok: false, t: d.error ?? 'Не удалось сохранить' });
      return;
    }
    // пустые/негодные блоки сервер отбрасывает — подтягиваем то, что реально сохранилось
    const cleaned: Form = {
      ...next,
      slug: d.slug,
      blocks: { ru: cleanBlocks(next.blocks.ru.map(strip)).map(withKey), hy: cleanBlocks(next.blocks.hy.map(strip)).map(withKey) },
    };
    setForm(cleaned);
    setSaved(snap(cleaned));
    setSlugTouched(true);
    setMsg({ ok: true, t: next.status === 'published' ? 'Сохранено и опубликовано' : 'Сохранено (черновик)' });
    if (!id) {
      setId(d.id);
      router.replace(`/admin/useful/${d.id}`);
    } else router.refresh();
  }

  async function remove() {
    if (!id || !confirm('Удалить материал навсегда?')) return;
    setBusy(true);
    const r = await fetch('/api/admin/useful', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'delete_page', id }) });
    setBusy(false);
    if (r.ok) {
      setSaved(snap(form)); // не спрашивать про несохранённое
      router.push('/admin/useful');
      router.refresh();
    } else setMsg({ ok: false, t: 'Не удалось удалить' });
  }

  const copyRu = () => {
    if (blocks.length && !confirm('Заменить армянскую версию копией русской?')) return;
    setForm((f) => ({
      ...f,
      title: { ...f.title, hy: f.title.hy || f.title.ru },
      summary: { ...f.summary, hy: f.summary.hy || f.summary.ru },
      blocks: { ...f.blocks, hy: f.blocks.ru.map((b) => ({ ...b, _k: uid() })) },
    }));
  };

  const preview = useMemo(() => cleanBlocks(blocks.map(strip)), [blocks]);
  const shownTitle = form.title[lang] || form.title.ru;
  const shownSummary = form.summary[lang] || form.summary.ru;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/useful" className="text-sm text-slate-500 hover:text-slate-800">← Все материалы</Link>
          <h1 className="text-xl font-bold">{id ? 'Редактирование' : 'Новый материал'}</h1>
          {dirty && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800" data-testid="dirty">не сохранено</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-ghost btn-sm lg:hidden" onClick={() => setShowPreview((v) => !v)}>{showPreview ? 'Редактор' : 'Предпросмотр'}</button>
          {id && form.status === 'published' && <Link href={`/useful/${form.slug}`} target="_blank" className="btn btn-ghost btn-sm">Открыть</Link>}
          {form.status === 'draft' ? (
            <>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => save('draft')} data-testid="save-draft">Сохранить черновик</button>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => save('published')} data-testid="publish">Опубликовать</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => save('draft')}>Снять с публикации</button>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => save('published')} data-testid="publish">Сохранить</button>
            </>
          )}
        </div>
      </div>
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={cn('mb-3 rounded-xl px-3 py-2 text-sm', msg.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')} data-testid="editor-msg">{msg.t}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className={cn('space-y-5', showPreview && 'hidden lg:block')}>
          {/* язык */}
          <div className="flex items-center gap-2">
            {(['ru', 'hy'] as ULang[]).map((l) => (
              <button key={l} type="button" onClick={() => setLang(l)} className={cn('chip', lang === l ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')} data-testid={`lang-${l}`}>
                {l === 'ru' ? 'Русский' : 'Հայերեն'}
                {l === 'hy' && (form.title.hy || form.blocks.hy.length > 0) && <span className="ml-1 opacity-70">●</span>}
              </button>
            ))}
            {lang === 'hy' && <button type="button" className="btn btn-ghost btn-sm ml-auto" onClick={copyRu}>Скопировать русскую версию</button>}
          </div>
          {lang === 'hy' && <p className="-mt-2 text-xs text-slate-400">Если армянская версия пустая, пользователи с армянским переводом увидят русскую.</p>}

          {/* основное */}
          <div className="card space-y-3 p-4">
            <div>
              <label className="label">Заголовок{lang === 'ru' ? ' *' : ''}</label>
              <input className="input" value={form.title[lang]} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={lang === 'hy' ? form.title.ru : 'Например: Как получить медицинскую справку'} data-testid="f-title" />
            </div>
            <div>
              <label className="label">Краткое описание (на карточке в списке)</label>
              <textarea className="input min-h-[3.5rem]" value={form.summary[lang]} onChange={(e) => setForm((f) => ({ ...f, summary: { ...f.summary, [lang]: e.target.value } }))} maxLength={300} placeholder={lang === 'hy' ? form.summary.ru : ''} data-testid="f-summary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Раздел</label>
                <select className="input" value={form.section_id} onChange={(e) => patch({ section_id: e.target.value })} data-testid="f-section">
                  <option value="">Без раздела</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.title.ru}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Адрес страницы /useful/…</label>
                <input className="input font-mono" value={form.slug} onChange={(e) => { setSlugTouched(true); patch({ slug: e.target.value.toLowerCase() }); }} placeholder="medspravka" data-testid="f-slug" />
              </div>
            </div>
            <div>
              <label className="label">Иконка</label>
              <div className="flex flex-wrap items-center gap-1.5">
                <input className="input !w-16 text-center text-lg" value={form.icon} onChange={(e) => patch({ icon: Array.from(e.target.value).slice(0, 2).join('') })} placeholder="📄" aria-label="Иконка" />
                {EMOJI.map((e) => (
                  <button key={e} type="button" onClick={() => patch({ icon: e })} className={cn('h-9 w-9 rounded-lg text-lg hover:bg-slate-100', form.icon === e && 'bg-brand-500/15')} aria-label={`Иконка ${e}`}>{e}</button>
                ))}
              </div>
            </div>
          </div>

          {/* блоки */}
          <div className="space-y-3" data-testid="blocks">
            {blocks.length === 0 && <div className="card p-5 text-center text-sm text-slate-400">Блоков пока нет. Добавьте первый ниже.</div>}
            {blocks.map((b, i) => (
              <BlockCard
                key={b._k}
                block={b}
                index={i}
                last={i === blocks.length - 1}
                onChange={(nb) => setBlocks(blocks.map((x, j) => (j === i ? nb : x)))}
                onMove={(d) => setBlocks(move(blocks, i, d))}
                onDup={() => setBlocks([...blocks.slice(0, i + 1), { ...JSON.parse(JSON.stringify(b)), _k: uid() }, ...blocks.slice(i + 1)])}
                onDelete={() => setBlocks(blocks.filter((_, j) => j !== i))}
              />
            ))}
          </div>

          <div className="card p-4">
            <button type="button" className="flex w-full items-center justify-between font-medium" onClick={() => setAdding((v) => !v)} aria-expanded={adding} data-testid="add-block">
              <span>+ Добавить блок</span>
              <span className="text-sm font-normal text-slate-400">{adding ? 'Скрыть' : 'Выбрать тип'}</span>
            </button>
            {adding && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BLOCK_TYPES.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    className="rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-500/5"
                    onClick={() => {
                      setBlocks([...blocks, blank(t.type)]);
                      setAdding(false);
                    }}
                    data-testid={`add-${t.type}`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                    <div className="mt-0.5 text-xs leading-snug text-slate-500">{t.hint}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {id && (
            <div className="pt-2">
              <button type="button" className="btn btn-ghost btn-sm text-red-700" onClick={remove} disabled={busy}>Удалить материал</button>
            </div>
          )}
        </div>

        {/* предпросмотр */}
        <aside className={cn('lg:sticky lg:top-4 lg:self-start', !showPreview && 'hidden lg:block')}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Так увидит пользователь</div>
          <div className="max-h-[80vh] overflow-y-auto rounded-3xl border border-slate-300 bg-ink p-4 shadow-sm" data-testid="preview">
            <h2 className="text-xl font-bold leading-tight">
              {form.icon && <span className="mr-2">{form.icon}</span>}
              {shownTitle || <span className="text-slate-300">Заголовок</span>}
            </h2>
            {shownSummary && <p className="mt-1.5 text-sm text-slate-500">{shownSummary}</p>}
            <div className="mt-4">
              {preview.length ? <Blocks blocks={preview} /> : <p className="text-sm text-slate-300">Пока пусто</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- карточка блока

function BlockCard({ block, index, last, onChange, onMove, onDup, onDelete }: {
  block: Draft; index: number; last: boolean; onChange: (b: Draft) => void; onMove: (d: -1 | 1) => void; onDup: () => void; onDelete: () => void;
}) {
  const meta = BLOCK_TYPES.find((t) => t.type === block.type)!;
  const set = (p: Record<string, unknown>) => onChange({ ...block, ...p });
  const iconBtn = 'rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-30';
  return (
    <div className="card p-4" data-testid="block" data-type={block.type}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-700">{index + 1}. {meta.label}</div>
        <div className="flex items-center gap-0.5">
          <button type="button" className={iconBtn} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Выше">↑</button>
          <button type="button" className={iconBtn} disabled={last} onClick={() => onMove(1)} aria-label="Ниже">↓</button>
          <button type="button" className={iconBtn} onClick={onDup} aria-label="Дублировать">⧉</button>
          <button type="button" className={cn(iconBtn, 'hover:text-red-700')} onClick={onDelete} aria-label="Удалить блок" data-testid="block-delete">✕</button>
        </div>
      </div>
      <BlockFields block={block} set={set} />
    </div>
  );
}

function Txt({ label, value, onChange, rows = 4, hint, testid }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string; testid?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea className="input" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} />
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
function Line({ label, value, onChange, placeholder, testid }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; testid?: string }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className="input" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} data-testid={testid} />
    </div>
  );
}

const RemoveBtn = ({ onClick, label = 'Убрать' }: { onClick: () => void; label?: string }) => (
  <button type="button" className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-700" onClick={onClick}>{label}</button>
);
const AddBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button type="button" className="btn btn-ghost btn-sm" onClick={onClick}>{children}</button>
);

function BlockFields({ block, set }: { block: Draft; set: (p: Record<string, unknown>) => void }) {
  const [up, setUp] = useState<{ busy: boolean; err: string | null }>({ busy: false, err: null });
  const file = useRef<HTMLInputElement>(null);

  switch (block.type) {
    case 'text':
      return <Txt label="Текст" value={block.text} onChange={(v) => set({ text: v })} rows={8} testid="b-text" hint="Абзацы — через пустую строку. «# Заголовок», «## Подзаголовок», «- пункт списка», «1. шаг», **жирный**, *курсив*, [текст ссылки](https://…)" />;
    case 'image':
      return (
        <div className="space-y-3">
          <div>
            <label className="label">Картинка: ссылка или загрузка (до 3 МБ)</label>
            <div className="flex flex-wrap gap-2">
              <input className="input min-w-[12rem] flex-1" value={block.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" data-testid="b-image-url" />
              <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                setUp({ busy: true, err: null });
                try {
                  set({ url: await upload(f) });
                  setUp({ busy: false, err: null });
                } catch (er: any) {
                  setUp({ busy: false, err: er.message });
                }
              }} />
              <button type="button" className="btn btn-ghost btn-sm" disabled={up.busy} onClick={() => file.current?.click()}>{up.busy ? 'Загружаю…' : 'Загрузить файл'}</button>
            </div>
            {up.err && <p role="alert" className="mt-1 text-xs text-red-700">{up.err}</p>}
          </div>
          {block.url && /^(https?:\/\/|\/)/.test(block.url) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={block.url} alt="" className="max-h-40 rounded-xl border border-slate-200 object-contain" />
          )}
          <Line label="Подпись (необязательно)" value={block.caption ?? ''} onChange={(v) => set({ caption: v })} />
        </div>
      );
    case 'video':
      return (
        <div className="space-y-3">
          <Line label="Ссылка на видео YouTube" value={block.url} onChange={(v) => set({ url: v })} placeholder="https://www.youtube.com/watch?v=…" testid="b-video-url" />
          <Line label="Подпись (необязательно)" value={block.caption ?? ''} onChange={(v) => set({ caption: v })} />
          <p className="text-[11px] text-slate-400">Подходят ссылки youtube.com/watch, youtu.be, youtube.com/shorts. Видео откроется прямо в приложении.</p>
        </div>
      );
    case 'callout':
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            {([['info', 'Важно'], ['warn', 'Внимание'], ['success', 'Хорошая новость']] as const).map(([t, l]) => (
              <button key={t} type="button" onClick={() => set({ tone: t })} className={cn('chip', block.tone === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}>{l}</button>
            ))}
          </div>
          <Txt label="Текст заметки" value={block.text} onChange={(v) => set({ text: v })} rows={3} testid="b-callout" />
        </div>
      );
    case 'link':
      return (
        <div className="space-y-3">
          <Line label="Текст кнопки" value={block.label} onChange={(v) => set({ label: v })} placeholder="Записаться на экзамен" testid="b-link-label" />
          <Line label="Ссылка" value={block.url} onChange={(v) => set({ url: v })} placeholder="https://… (или mailto:, tel:)" testid="b-link-url" />
          <Line label="Пояснение (необязательно)" value={block.description ?? ''} onChange={(v) => set({ description: v })} />
        </div>
      );
    case 'divider':
      return <p className="text-sm text-slate-400">Тонкая линия между частями материала.</p>;
    case 'steps': {
      const items: { title: string; text?: string }[] = block.items;
      const upd = (i: number, p: object) => set({ items: items.map((x, j) => (j === i ? { ...x, ...p } : x)) });
      return (
        <div className="space-y-3">
          <Line label="Заголовок блока (необязательно)" value={block.title ?? ''} onChange={(v) => set({ title: v })} />
          {items.map((s, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3" data-testid="step">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Шаг {i + 1}</span>
                <span className="flex">
                  <button type="button" className="px-1.5 hover:text-slate-700 disabled:opacity-30" disabled={i === 0} onClick={() => set({ items: move(items, i, -1) })} aria-label="Шаг выше">↑</button>
                  <button type="button" className="px-1.5 hover:text-slate-700 disabled:opacity-30" disabled={i === items.length - 1} onClick={() => set({ items: move(items, i, 1) })} aria-label="Шаг ниже">↓</button>
                  <RemoveBtn onClick={() => set({ items: items.filter((_, j) => j !== i) })} />
                </span>
              </div>
              <Line value={s.title} onChange={(v) => upd(i, { title: v })} placeholder="Что сделать" testid="b-step-title" />
              <textarea className="input mt-2" rows={2} value={s.text ?? ''} onChange={(e) => upd(i, { text: e.target.value })} placeholder="Подробности (необязательно)" />
            </div>
          ))}
          <AddBtn onClick={() => set({ items: [...items, { title: '', text: '' }] })}>+ Шаг</AddBtn>
        </div>
      );
    }
    case 'checklist': {
      const items: string[] = block.items;
      return (
        <div className="space-y-2">
          <Line label="Заголовок (необязательно)" value={block.title ?? ''} onChange={(v) => set({ title: v })} placeholder="Что взять с собой" />
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className="input" value={it} onChange={(e) => set({ items: items.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={`Пункт ${i + 1}`} data-testid="b-check-item" />
              <RemoveBtn onClick={() => set({ items: items.filter((_, j) => j !== i) })} />
            </div>
          ))}
          <AddBtn onClick={() => set({ items: [...items, ''] })}>+ Пункт</AddBtn>
        </div>
      );
    }
    case 'faq': {
      const items: { q: string; a: string }[] = block.items;
      const upd = (i: number, p: object) => set({ items: items.map((x, j) => (j === i ? { ...x, ...p } : x)) });
      return (
        <div className="space-y-3">
          {items.map((f, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex justify-between text-xs text-slate-400"><span>Вопрос {i + 1}</span><RemoveBtn onClick={() => set({ items: items.filter((_, j) => j !== i) })} /></div>
              <Line value={f.q} onChange={(v) => upd(i, { q: v })} placeholder="Вопрос" />
              <textarea className="input mt-2" rows={3} value={f.a} onChange={(e) => upd(i, { a: e.target.value })} placeholder="Ответ" />
            </div>
          ))}
          <AddBtn onClick={() => set({ items: [...items, { q: '', a: '' }] })}>+ Вопрос</AddBtn>
        </div>
      );
    }
    case 'table': {
      const headers: string[] = block.headers;
      const rows: string[][] = block.rows;
      const cols = headers.length;
      const setCell = (r: number, c: number, v: string) => set({ rows: rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)) });
      return (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1.5 text-sm">
              <thead>
                <tr>
                  {headers.map((h, c) => (
                    <th key={c} className="min-w-[8rem] font-normal">
                      <input className="input !bg-slate-50 font-semibold" value={h} placeholder={`Колонка ${c + 1}`} onChange={(e) => set({ headers: headers.map((x, j) => (j === c ? e.target.value : x)) })} />
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r}>
                    {Array.from({ length: cols }, (_, c) => (
                      <td key={c}><input className="input" value={row[c] ?? ''} onChange={(e) => setCell(r, c, e.target.value)} data-testid="b-cell" /></td>
                    ))}
                    <td><RemoveBtn onClick={() => set({ rows: rows.filter((_, i) => i !== r) })} label="✕" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddBtn onClick={() => set({ rows: [...rows, Array.from({ length: cols }, () => '')] })}>+ Строка</AddBtn>
            <AddBtn onClick={() => cols < 8 && set({ headers: [...headers, ''], rows: rows.map((r) => [...r, '']) })}>+ Колонка</AddBtn>
            {cols > 1 && <AddBtn onClick={() => set({ headers: headers.slice(0, -1), rows: rows.map((r) => r.slice(0, -1)) })}>− Колонка</AddBtn>}
          </div>
          <p className="text-[11px] text-slate-400">В ячейках работают **жирный**, *курсив* и [ссылки](https://…).</p>
        </div>
      );
    }
  }
}
