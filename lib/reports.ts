/** «Сообщить о проблеме»: причины и ограничения (общие для формы и сервера) */
export const REPORT_REASONS = [
  { value: 'wrong_answer', label: 'Неверный ответ' },
  { value: 'bad_explanation', label: 'Плохой разбор' },
  { value: 'bad_translation', label: 'Плохой перевод' },
  { value: 'bad_image', label: 'Проблема с картинкой' },
  { value: 'other', label: 'Другое' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['value'];

export const REPORT_REASON_LABEL: Record<string, string> = Object.fromEntries(REPORT_REASONS.map((r) => [r.value, r.label]));

export const isReportReason = (v: unknown): v is ReportReason => REPORT_REASONS.some((r) => r.value === v);

export const REPORT_COMMENT_MAX = 1000;
/** Не больше стольких сообщений от одного человека в сутки (защита от спама) */
export const REPORTS_PER_DAY = 30;
