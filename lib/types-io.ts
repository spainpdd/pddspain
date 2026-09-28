export { LANGS, RIGHTS_STATUSES } from './types';
export type { Lang, RightsStatus } from './types';
export const isChoiceStr = (x: unknown): x is 'a' | 'b' | 'c' => x === 'a' || x === 'b' || x === 'c';
