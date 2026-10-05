/**
 * «Полезно»: материалы из блоков. Здесь — чистые функции без обращения к БД и React:
 * типы блоков, очистка (то, что пришло из админки, никогда не доверяем) и разбор ссылок.
 * Используется и сервером (сохранение), и клиентом (предпросмотр в редакторе).
 */

export type ULang = 'ru' | 'hy';
export const ULANGS: ULang[] = ['ru', 'hy'];

export type CalloutTone = 'info' | 'warn' | 'success';

export type Block =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'video'; url: string; caption?: string }
  | { type: 'callout'; tone: CalloutTone; text: string }
  | { type: 'steps'; title?: string; items: { title: string; text?: string }[] }
  | { type: 'checklist'; title?: string; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'faq'; items: { q: string; a: string }[] }
  | { type: 'link'; label: string; url: string; description?: string }
  | { type: 'divider' };

export type BlockType = Block['type'];

export const BLOCK_TYPES: { type: BlockType; label: string; hint: string }[] = [
  { type: 'text', label: 'Текст', hint: 'Абзацы, заголовки, списки, ссылки' },
  { type: 'image', label: 'Фото', hint: 'Картинка с подписью' },
  { type: 'video', label: 'Видео YouTube', hint: 'Вставляется ссылкой' },
  { type: 'steps', label: 'Шаги', hint: 'Пошаговая инструкция: 1, 2, 3…' },
  { type: 'checklist', label: 'Чек-лист', hint: 'Что взять с собой: пункты можно отмечать' },
  { type: 'table', label: 'Таблица', hint: 'Например, страны и условия обмена прав' },
  { type: 'faq', label: 'Вопрос-ответ', hint: 'Раскрывающиеся ответы' },
  { type: 'callout', label: 'Заметка', hint: 'Важно, внимание или хорошая новость' },
  { type: 'link', label: 'Кнопка-ссылка', hint: 'Внешний сайт: запись, форма, DGT' },
  { type: 'divider', label: 'Разделитель', hint: 'Тонкая линия' },
];

export const LIMITS = { blocks: 200, text: 20_000, short: 300, title: 120, summary: 300, items: 60, cols: 8, rows: 60 };

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : '');

/** Только http(s); mailto и tel — для ссылок. Относительные пути (/uploads/…) допустимы для картинок. */
export function safeUrl(v: unknown, opts: { allowRelative?: boolean; allowContact?: boolean } = {}): string {
  const u = typeof v === 'string' ? v.trim() : '';
  if (!u || u.length > 2000) return '';
  if (/^https?:\/\/[^\s]+$/i.test(u)) return u;
  if (opts.allowContact && /^(mailto:|tel:)[^\s]+$/i.test(u)) return u;
  if (opts.allowRelative && /^\/(?!\/)[^\s]*$/.test(u)) return u;
  return '';
}

/** id YouTube-ролика из ссылки (watch, youtu.be, shorts, embed, live) или null */
export function youtubeId(url: string): string | null {
  const m = url
    .trim()
    .match(/^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#/]|$)/);
  return m ? m[1] : null;
}

const TONES: CalloutTone[] = ['info', 'warn', 'success'];

/** Приводит блок из админки к безопасному виду; негодные блоки отбрасываются (null) */
export function cleanBlock(raw: unknown): Block | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, any>;
  switch (b.type) {
    case 'text': {
      const text = str(b.text, LIMITS.text);
      return text ? { type: 'text', text } : null;
    }
    case 'image': {
      const url = safeUrl(b.url, { allowRelative: true });
      if (!url) return null;
      const caption = str(b.caption, LIMITS.short);
      return caption ? { type: 'image', url, caption } : { type: 'image', url };
    }
    case 'video': {
      const url = str(b.url, 500);
      if (!youtubeId(url)) return null;
      const caption = str(b.caption, LIMITS.short);
      return caption ? { type: 'video', url, caption } : { type: 'video', url };
    }
    case 'callout': {
      const text = str(b.text, 3000);
      if (!text) return null;
      return { type: 'callout', tone: TONES.includes(b.tone) ? b.tone : 'info', text };
    }
    case 'steps': {
      const items = (Array.isArray(b.items) ? b.items : [])
        .slice(0, LIMITS.items)
        .map((i: any) => ({ title: str(i?.title, LIMITS.short), text: str(i?.text, 3000) }))
        .filter((i: { title: string; text: string }) => i.title || i.text)
        .map((i: { title: string; text: string }) => (i.text ? i : { title: i.title }));
      if (!items.length) return null;
      const title = str(b.title, LIMITS.short);
      return title ? { type: 'steps', title, items } : { type: 'steps', items };
    }
    case 'checklist': {
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, LIMITS.items).map((i: unknown) => str(i, LIMITS.short)).filter(Boolean);
      if (!items.length) return null;
      const title = str(b.title, LIMITS.short);
      return title ? { type: 'checklist', title, items } : { type: 'checklist', items };
    }
    case 'table': {
      const headers = (Array.isArray(b.headers) ? b.headers : []).slice(0, LIMITS.cols).map((h: unknown) => str(h, 80));
      const cols = Math.max(headers.length, 1);
      const rows = (Array.isArray(b.rows) ? b.rows : [])
        .slice(0, LIMITS.rows)
        .map((r: unknown) => Array.from({ length: cols }, (_, i) => str(Array.isArray(r) ? r[i] : '', 500)))
        .filter((r: string[]) => r.some(Boolean));
      if (!rows.length) return null;
      return { type: 'table', headers: Array.from({ length: cols }, (_, i) => headers[i] ?? ''), rows };
    }
    case 'faq': {
      const items = (Array.isArray(b.items) ? b.items : [])
        .slice(0, LIMITS.items)
        .map((i: any) => ({ q: str(i?.q, LIMITS.short), a: str(i?.a, 5000) }))
        .filter((i: { q: string; a: string }) => i.q && i.a);
      return items.length ? { type: 'faq', items } : null;
    }
    case 'link': {
      const url = safeUrl(b.url, { allowContact: true });
      const label = str(b.label, 100);
      if (!url || !label) return null;
      const description = str(b.description, LIMITS.short);
      return description ? { type: 'link', label, url, description } : { type: 'link', label, url };
    }
    case 'divider':
      return { type: 'divider' };
    default:
      return null;
  }
}

export function cleanBlocks(raw: unknown): Block[] {
  return (Array.isArray(raw) ? raw : [])
    .slice(0, LIMITS.blocks)
    .map(cleanBlock)
    .filter((b): b is Block => b !== null);
}

/** Объект {ru, hy} с обрезанными строками */
export function cleanI18n(raw: unknown, max: number): Record<ULang, string> {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return { ru: str(o.ru, max), hy: str(o.hy, max) };
}

export function cleanBlocksI18n(raw: unknown): Record<ULang, Block[]> {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return { ru: cleanBlocks(o.ru), hy: cleanBlocks(o.hy) };
}

/** Текст на языке пользователя; если перевода нет — русский */
export function pickText(v: Partial<Record<ULang, string>> | null | undefined, lang: ULang): string {
  return (v?.[lang]?.trim() ? v[lang] : v?.ru) ?? '';
}

export function pickBlocks(v: Partial<Record<ULang, Block[]>> | null | undefined, lang: ULang): Block[] {
  const own = v?.[lang];
  return own && own.length ? own : v?.ru ?? [];
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** Адрес страницы из заголовка: «Как получить медсправку» → kak-poluchit-medspravku */
export function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .split('')
    .map((c) => TRANSLIT[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return s || 'material';
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
