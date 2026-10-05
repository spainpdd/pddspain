import 'server-only';
import { cookies, headers } from 'next/headers';
import { langFromAcceptLanguage, normalizeLang, SITE_LANG_COOKIE, type SiteLang } from './site-i18n';

/** Язык публичных страниц: выбранный вручную (cookie) → иначе по Accept-Language → русский */
export function getSiteLang(): SiteLang {
  return normalizeLang(cookies().get(SITE_LANG_COOKIE)?.value) ?? langFromAcceptLanguage(headers().get('accept-language'));
}
