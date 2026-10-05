/** CSV для Excel: BOM + разделитель «;» (русская локаль), защита от формул (=, +, -, @) */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: { key: string; title: string }[], rows: Record<string, unknown>[]): string {
  const head = columns.map((c) => csvCell(c.title)).join(';');
  const body = rows.map((r) => columns.map((c) => csvCell(r[c.key])).join(';'));
  return '﻿' + [head, ...body].join('\r\n') + '\r\n';
}

export function csvResponse(name: string, text: string): Response {
  return new Response(text, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${name}"`,
      'cache-control': 'no-store',
    },
  });
}
