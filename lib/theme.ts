/**
 * Тёмная тема. Режимы: «auto» (тёмная с 21:00 до 07:00 по времени на устройстве), «light», «dark».
 * Выбор хранится в localStorage на устройстве. Скрипт ниже выполняется в <head> до отрисовки, чтобы не было вспышки.
 */
export type ThemePref = 'auto' | 'light' | 'dark';
export const THEME_KEY = 'theme';
export const DARK_FROM_HOUR = 21; // включительно
export const DARK_TO_HOUR = 7; // не включая
export const LIGHT_COLOR = '#eef2f9';
export const DARK_COLOR = '#0b1220';

export function normalizePref(x: unknown): ThemePref {
  return x === 'light' || x === 'dark' ? x : 'auto';
}

export function isNightHour(hour: number): boolean {
  return hour >= DARK_FROM_HOUR || hour < DARK_TO_HOUR;
}

export function resolveTheme(pref: ThemePref, hour: number): 'light' | 'dark' {
  if (pref === 'dark') return 'dark';
  if (pref === 'light') return 'light';
  return isNightHour(hour) ? 'dark' : 'light';
}

/** Применяет тему к <html> и цвету адресной строки. Один и тот же код — для скрипта в <head> и для клиента. */
export const applyThemeScript = `(function(){try{var p=null;try{p=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(_){}
if(p!=='light'&&p!=='dark')p='auto';var h=new Date().getHours();
var d=p==='dark'||(p==='auto'&&(h>=${DARK_FROM_HOUR}||h<${DARK_TO_HOUR}));
var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';
var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?${JSON.stringify(DARK_COLOR)}:${JSON.stringify(LIGHT_COLOR)});
}catch(_){}})();`;

export function readPref(): ThemePref {
  try {
    return normalizePref(localStorage.getItem(THEME_KEY));
  } catch {
    return 'auto';
  }
}

export function savePref(p: ThemePref) {
  try {
    if (p === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, p);
  } catch {
    /* приватный режим — просто не запоминаем */
  }
}

/** Перечитывает режим и применяет тему (вызывается на клиенте: при смене режима, раз в минуту и при возвращении на вкладку) */
export function applyTheme() {
  // eslint-disable-next-line no-new-func
  new Function(applyThemeScript)();
}
