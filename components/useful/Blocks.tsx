'use client';

/**
 * Показ материала «Полезно» из блоков. Один и тот же компонент и для пользователей, и для предпросмотра в админке.
 * Никакого dangerouslySetInnerHTML: текст разбирается в React-элементы, ссылки проходят safeUrl.
 */
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Info, Check } from 'lucide-react';
import { safeUrl, youtubeId, type Block, type CalloutTone } from '@/lib/useful';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------- текст

const INLINE = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** **жирный**, *курсив*, [текст](ссылка) */
export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(text.slice(last, i));
    if (m[1] !== undefined) out.push(<strong key={k++} className="font-semibold">{m[1]}</strong>);
    else if (m[2] !== undefined) out.push(<em key={k++}>{m[2]}</em>);
    else {
      const href = safeUrl(m[4], { allowContact: true, allowRelative: true });
      out.push(
        href ? (
          <a key={k++} href={href} target={/^https?:/i.test(href) ? '_blank' : undefined} rel="noopener noreferrer" className="text-brand-600 underline underline-offset-2">
            {m[3]}
          </a>
        ) : (
          m[3]
        ),
      );
    }
    last = i + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out.map((n, i) => (typeof n === 'string' ? <Fragment key={`t${i}`}>{n}</Fragment> : n))}</>;
}

/** Абзацы через пустую строку; «# » и «## » — заголовки; «- » — список; «1. » — нумерованный список */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-[0.98rem] leading-relaxed text-slate-700">
      {parts.map((part, i) => {
        const lines = part.split('\n');
        if (/^#{1,2} /.test(lines[0])) {
          const h2 = lines[0].startsWith('# ');
          const head = lines[0].replace(/^#{1,2} /, '');
          const rest = lines.slice(1).join('\n');
          return (
            <div key={i}>
              {h2 ? <h2 className="text-xl font-bold text-slate-900">{head}</h2> : <h3 className="text-lg font-semibold text-slate-900">{head}</h3>}
              {rest && <p className="mt-1.5 whitespace-pre-line"><Inline text={rest} /></p>}
            </div>
          );
        }
        if (lines.every((l) => /^[-*] /.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}><Inline text={l.slice(2)} /></li>)}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+[.)] /.test(l))) {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\d+[.)] /, '')} /></li>)}
            </ol>
          );
        }
        return <p key={i} className="whitespace-pre-line"><Inline text={part} /></p>;
      })}
    </div>
  );
}

// ---------------------------------------------------------------- блоки

const TONE: Record<CalloutTone, { cls: string; Icon: typeof Info }> = {
  info: { cls: 'border-brand-500/40 bg-brand-500/10 text-slate-800', Icon: Info },
  warn: { cls: 'border-amber-500/50 bg-amber-400/15 text-amber-950', Icon: AlertTriangle },
  success: { cls: 'border-green-600/40 bg-green-500/10 text-green-950', Icon: CheckCircle2 },
};
const TONE_ICON: Record<CalloutTone, string> = { info: 'text-brand-600', warn: 'text-amber-600', success: 'text-green-600' };

function Checklist({ block, storageKey }: { block: Extract<Block, { type: 'checklist' }>; storageKey?: string }) {
  const [done, setDone] = useState<boolean[]>(() => block.items.map(() => false));
  useEffect(() => {
    if (!storageKey) return;
    try {
      const s = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (Array.isArray(s)) setDone(block.items.map((_, i) => s[i] === true));
    } catch {}
  }, [storageKey, block.items]);
  const toggle = (i: number) =>
    setDone((d) => {
      const n = d.map((v, j) => (j === i ? !v : v));
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(n));
        } catch {}
      }
      return n;
    });
  const count = done.filter(Boolean).length;
  return (
    <div className="card p-4">
      {block.title && (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="font-semibold text-slate-900">{block.title}</h3>
          <span className="text-xs tabular-nums text-slate-400">{count}/{block.items.length}</span>
        </div>
      )}
      <ul className="space-y-1">
        {block.items.map((it, i) => (
          <li key={i}>
            <button type="button" onClick={() => toggle(i)} className="flex w-full items-start gap-3 rounded-xl px-1 py-1.5 text-left" aria-pressed={done[i]}>
              <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition', done[i] ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 bg-white')}>
                {done[i] && <Check size={13} strokeWidth={3.5} />}
              </span>
              <span className={cn('text-[0.97rem] leading-snug', done[i] ? 'text-slate-400 line-through' : 'text-slate-700')}>{it}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BlockView({ block, storageKey }: { block: Block; storageKey?: string }) {
  switch (block.type) {
    case 'text':
      return <RichText text={block.text} />;
    case 'image': {
      const url = safeUrl(block.url, { allowRelative: true });
      if (!url) return null;
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={block.caption ?? ''} loading="lazy" className="w-full rounded-2xl border border-slate-200 bg-white object-contain" />
          {block.caption && <figcaption className="mt-1.5 text-center text-xs text-slate-500">{block.caption}</figcaption>}
        </figure>
      );
    }
    case 'video': {
      const id = youtubeId(block.url);
      if (!id) return null;
      return (
        <figure>
          <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title={block.caption || 'YouTube'}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          {block.caption && <figcaption className="mt-1.5 text-center text-xs text-slate-500">{block.caption}</figcaption>}
        </figure>
      );
    }
    case 'callout': {
      const { cls, Icon } = TONE[block.tone];
      return (
        <div className={cn('flex gap-3 rounded-2xl border p-4', cls)} role="note">
          <Icon size={20} className={cn('mt-0.5 shrink-0', TONE_ICON[block.tone])} />
          <div className="min-w-0 flex-1 text-[0.95rem] leading-relaxed"><RichText text={block.text} /></div>
        </div>
      );
    }
    case 'steps':
      return (
        <div className="card p-4">
          {block.title && <h3 className="mb-3 font-semibold text-slate-900">{block.title}</h3>}
          <ol className="space-y-4">
            {block.items.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1 pt-0.5">
                  {s.title && <div className="font-medium text-slate-900"><Inline text={s.title} /></div>}
                  {s.text && <div className="mt-1 text-[0.95rem] leading-relaxed text-slate-600"><RichText text={s.text} /></div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    case 'checklist':
      return <Checklist block={block} storageKey={storageKey} />;
    case 'table':
      return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[20rem] text-left text-sm">
            {block.headers.some(Boolean) && (
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>{block.headers.map((h, i) => <th key={i} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100">
              {block.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} className={cn('px-3 py-2.5 align-top text-slate-700', j === 0 && 'font-medium text-slate-900')}><Inline text={c} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'faq':
      return (
        <div className="card divide-y divide-slate-100">
          {block.items.map((f, i) => (
            <details key={i} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-slate-400 transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <div className="mt-2"><RichText text={f.a} /></div>
            </details>
          ))}
        </div>
      );
    case 'link': {
      const url = safeUrl(block.url, { allowContact: true });
      if (!url) return null;
      const ext = /^https?:/i.test(url);
      return (
        <a href={url} target={ext ? '_blank' : undefined} rel="noopener noreferrer" className="card flex items-center gap-3 p-4 transition hover:shadow-md">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-brand-700">{block.label}</div>
            {block.description && <div className="mt-0.5 text-sm text-slate-500">{block.description}</div>}
          </div>
          <ExternalLink size={18} className="shrink-0 text-brand-600" />
        </a>
      );
    }
    case 'divider':
      return <hr className="border-slate-200" />;
  }
}

export default function Blocks({ blocks, storageId }: { blocks: Block[]; storageId?: string }) {
  return (
    <div className="space-y-5" data-testid="useful-blocks">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} storageKey={storageId ? `useful:${storageId}:${i}` : undefined} />
      ))}
    </div>
  );
}
