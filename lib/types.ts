export type Lang = 'es' | 'en' | 'ru' | 'hy';
export type StudyLang = 'es' | 'en';
export type TransLang = 'ru' | 'hy';
export type Choice = 'a' | 'b' | 'c';
export type RightsStatus = 'own' | 'dgt_official' | 'licensed' | 'unverified';
/** official — основной платный тренажёр (прогресс, разблокировка по порядку); mixed — доп. тесты без ограничений */
export type TestCategory = 'official' | 'mixed';
export type TranslationStatus = 'machine' | 'reviewed';

export const LANGS: Lang[] = ['es', 'en', 'ru', 'hy'];
export const CHOICES: Choice[] = ['a', 'b', 'c'];
export const RIGHTS_STATUSES: RightsStatus[] = ['own', 'dgt_official', 'licensed', 'unverified'];
export const TEST_CATEGORIES: TestCategory[] = ['official', 'mixed'];

/** Варианты ответа вопроса: у части вопросов их два (пустой C в испанском оригинале) */
export function choicesOf(q: { i18n: Partial<Record<Lang, { c: string }>> }): Choice[] {
  const c = q.i18n.es?.c;
  return c === undefined || c.trim() ? CHOICES : ['a', 'b'];
}

/** Текст вопроса на одном языке */
export interface Content {
  text: string;
  a: string;
  b: string;
  c: string;
  explanation: string | null;
  status?: TranslationStatus;
}

/** Вопрос в том виде, в котором он уходит в плеер (все 4 языка — чтобы переключать мгновенно) */
export interface PlayerQuestion {
  id: string;
  correct: Choice;
  image_url: string | null;
  topic: string | null;
  /** официальный материал DGT (rights_status = dgt_official) — показываем ссылку на источник */
  official?: boolean;
  i18n: Partial<Record<Lang, Content>>;
}

export interface Profile {
  id: string;
  telegram_id: number;
  telegram_username: string | null;
  display_name: string | null;
  photo_url: string | null;
  study_lang: StudyLang;
  trans_lang: TransLang;
  auto_translate: boolean;
  notify: boolean;
  is_admin: boolean;
  access_until: string | null;
  guarantee_eligible: boolean;
  exam_passed_at: string | null;
  created_at: string;
}

export type TestStatus = 'locked' | 'available' | 'passed';

export interface TestListItem {
  category: TestCategory;
  number: number;
  playable: number;
  status: TestStatus;
  attempts: number;
  best_errors: number | null;
  last_errors: number | null;
  free: boolean;
}

export interface SubmitResult {
  errors: number;
  total: number;
  outcome: 'perfect' | 'pass_review' | 'fail';
  wrongIds: string[];
  passed: boolean;
  nextTest: number | null;
}

/** Входной ответ пользователя: id вопроса → выбранный вариант */
export type AnswerMap = Record<string, Choice>;
