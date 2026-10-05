/** Тексты публичных страниц (лендинг, вход) на русском и армянском. Без обращения к БД и серверным API. */
export type SiteLang = 'ru' | 'hy';
export const SITE_LANGS: SiteLang[] = ['ru', 'hy'];
export const SITE_LANG_COOKIE = 'site_lang';

export function normalizeLang(x: unknown): SiteLang | null {
  return x === 'ru' || x === 'hy' ? x : null;
}

/** Язык по заголовку Accept-Language: «hy…» → армянский, иначе русский */
export function langFromAcceptLanguage(h: string | null | undefined): SiteLang {
  const first = (h ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('hy') ? 'hy' : 'ru';
}

export interface LandingText {
  brand: string;
  login: string;
  heroTop: string;
  heroAccent: string;
  heroSub: string;
  ctaStart: string;
  ctaPricing: string;
  freeNote: string;
  features: { title: string; text: string }[];
  priceBadge: string;
  priceDays: string;
  priceList: string[];
  priceCta: string;
  disclaimer: string;
  legal: string;
  offer: string;
  privacy: string;
}

export interface LoginText {
  title: string;
  lead: string;
  fallback: string;
  noBot: string;
  home: string;
  errGeneric: string;
  errBad: string;
  errExpired: string;
  errNoToken: string;
  agree: { pre: string; privacy: string; and: string; consent: string };
  tg: { signIn: string; waiting: string; notOpened: string; clickHere: string; timeout: string; failed: string; retry: string };
}

export const LANDING: Record<SiteLang, LandingText> = {
  ru: {
    brand: '🚦 DGT Права',
    login: 'Войти',
    heroTop: 'Сдайте теорию DGT',
    heroAccent: 'с первого раза',
    heroSub: 'Тренажёр для русско- и армяноязычных: решаете реальный формат теста, а непонятное переводится одним тапом.',
    ctaStart: 'Начать бесплатно',
    ctaPricing: 'Тариф',
    freeNote: 'Один тест в день — бесплатно, без карты.',
    features: [
      { title: '90 тестов по 30 вопросов', text: 'Идёте по порядку: не больше 2 ошибок — открывается следующий тест. После каждого ответа сразу пояснение по правилам.' },
      { title: 'Раздел ошибок', text: 'Каждый неверный ответ запоминается. Заходите в «Ошибки» — и получаете по 5 вопросов, которые пока не даются.' },
      { title: 'Перевод в один тап', text: 'Учите билеты на испанском или английском и в любой момент включайте перевод на русский или армянский.' },
      { title: 'Гарантия «до сдачи»', text: 'Не сдали с первого раза — доступ продлевается, пока не сдадите экзамен.' },
    ],
    priceBadge: 'Один тариф',
    priceDays: '100 дней доступа',
    priceList: [
      'Все тесты и раздел ошибок',
      'Испанский / английский + русский / армянский',
      'Бот в Telegram: вопрос дня и ваши результаты',
      'Не сдали с первого раза — доступ продлевается',
      'Работает как приложение на телефоне',
    ],
    priceCta: 'Получить доступ',
    disclaimer: 'Независимый учебный сервис. Не связан с Dirección General de Tráfico (DGT) и не является официальным ресурсом.',
    legal: 'Условия и источники',
    offer: 'Оферта',
    privacy: 'Политика конфиденциальности',
  },
  hy: {
    brand: '🚦 DGT Վարորդական',
    login: 'Մուտք',
    heroTop: 'Հանձնեք DGT տեսությունը',
    heroAccent: 'առաջին փորձից',
    heroSub: 'Մարզիչ ռուսախոս և հայախոս օգտատերերի համար. լուծում եք իրական թեստի ձևաչափով, իսկ անհասկանալին թարգմանվում է մեկ հպումով։',
    ctaStart: 'Սկսել անվճար',
    ctaPricing: 'Սակագին',
    freeNote: 'Օրական մեկ թեստ՝ անվճար, առանց քարտի։',
    features: [
      { title: '90 թեստ՝ 30 հարցով', text: 'Անցեք հերթականությամբ. առավելագույնը 2 սխալի դեպքում բացվում է հաջորդ թեստը։ Յուրաքանչյուր պատասխանից հետո՝ անմիջապես բացատրություն կանոնների մասին։' },
      { title: 'Սխալների բաժին', text: 'Յուրաքանչյուր սխալ պատասխան հիշվում է։ Մտեք «Սխալներ» և ստացեք 5 հարց, որոնք դեռ չեն ստացվում։' },
      { title: 'Թարգմանություն մեկ հպումով', text: 'Սովորեք տոմսերը իսպաներեն կամ անգլերեն և ցանկացած պահի միացրեք թարգմանությունը ռուսերեն կամ հայերեն։' },
      { title: 'Երաշխիք՝ մինչև հանձնելը', text: 'Առաջին փորձից չհանձնեցիք՝ հասանելիությունը երկարաձգվում է, մինչև հանձնեք քննությունը։' },
    ],
    priceBadge: 'Մեկ սակագին',
    priceDays: '100 օր հասանելիություն',
    priceList: [
      'Բոլոր թեստերը և սխալների բաժինը',
      'Իսպաներեն / անգլերեն + ռուսերեն / հայերեն',
      'Telegram բոտ՝ օրվա հարցը և ձեր արդյունքները',
      'Առաջին փորձից չհանձնեցիք՝ հասանելիությունը երկարաձգվում է',
      'Աշխատում է հեռախոսում՝ որպես հավելված',
    ],
    priceCta: 'Ստանալ հասանելիություն',
    disclaimer: 'Անկախ ուսումնական ծառայություն։ Կապված չէ Dirección General de Tráfico (DGT)-ի հետ և պաշտոնական ռեսուրս չէ։',
    legal: 'Պայմաններ և աղբյուրներ',
    offer: 'Օֆերտա',
    privacy: 'Գաղտնիության քաղաքականություն',
  },
};

export const LOGIN: Record<SiteLang, LoginText> = {
  ru: {
    title: 'Вход',
    lead: 'Войдите через Telegram — так мы сохраним ваш прогресс и будем присылать «вопрос дня».',
    fallback: 'Не работает? Войти через браузер',
    noBot: 'Не задан NEXT_PUBLIC_TELEGRAM_BOT_USERNAME — кнопка Telegram недоступна.',
    home: 'На главную',
    errGeneric: 'Ошибка входа.',
    errBad: 'Не удалось проверить вход через Telegram. Попробуйте ещё раз.',
    errExpired: 'Вход устарел. Попробуйте ещё раз.',
    errNoToken: 'Вход через Telegram не настроен на сервере (нет токена бота).',
    agree: { pre: 'Входя через Telegram, вы соглашаетесь с', privacy: 'политикой конфиденциальности', and: 'и даёте', consent: 'согласие на обработку персональных данных.' },
    tg: {
      signIn: 'Войти через Telegram',
      waiting: 'Ждём подтверждения в Telegram…',
      notOpened: 'Приложение не открылось само?',
      clickHere: 'Нажмите сюда',
      timeout: 'Не дождались подтверждения. Попробуйте ещё раз.',
      failed: 'Не удалось начать вход. Попробуйте ещё раз.',
      retry: 'Попробовать снова',
    },
  },
  hy: {
    title: 'Մուտք',
    lead: 'Մուտք գործեք Telegram-ով. այդպես մենք կպահպանենք ձեր առաջընթացը և կուղարկենք «օրվա հարցը»։',
    fallback: 'Չի աշխատո՞ւմ։ Մուտք գործել բրաուզերով',
    noBot: 'NEXT_PUBLIC_TELEGRAM_BOT_USERNAME-ը նշված չէ. Telegram կոճակը հասանելի չէ։',
    home: 'Գլխավոր էջ',
    errGeneric: 'Մուտքի սխալ։',
    errBad: 'Չհաջողվեց ստուգել Telegram-ով մուտքը։ Փորձեք կրկին։',
    errExpired: 'Մուտքի ժամկետը լրացել է։ Փորձեք կրկին։',
    errNoToken: 'Telegram-ով մուտքը սերվերում կարգավորված չէ (բոտի թոքեն չկա)։',
    agree: { pre: 'Telegram-ով մուտք գործելով՝ դուք համաձայնվում եք', privacy: 'գաղտնիության քաղաքականությանը', and: 'և տալիս եք', consent: 'համաձայնություն անձնական տվյալների մշակման համար։' },
    tg: {
      signIn: 'Մուտք գործել Telegram-ով',
      waiting: 'Սպասում ենք հաստատմանը Telegram-ում…',
      notOpened: 'Հավելվածը ինքնուրույն չբացվե՞ց։',
      clickHere: 'Սեղմեք այստեղ',
      timeout: 'Հաստատում չստացվեց։ Փորձեք կրկին։',
      failed: 'Չհաջողվեց սկսել մուտքը։ Փորձեք կրկին։',
      retry: 'Փորձել կրկին',
    },
  },
};

export interface CookieText {
  text: string;
  more: string;
  ok: string;
}

/** Уведомление о cookie (баннер внизу экрана) */
export const COOKIE: Record<SiteLang, CookieText> = {
  ru: {
    text: 'Мы используем только технические cookie (вход в аккаунт, язык) и память браузера для сохранения хода теста. На странице оплаты платёжный сервис может использовать свои cookie.',
    more: 'Политика конфиденциальности',
    ok: 'Понятно',
  },
  hy: {
    text: 'Մենք օգտագործում ենք միայն տեխնիկական cookie-ներ (հաշիվ մուտք, լեզու) և դիտարկիչի հիշողությունը թեստի ընթացքը պահելու համար։ Վճարման էջում վճարային ծառայությունը կարող է օգտագործել իր cookie-ները։',
    more: 'Գաղտնիության քաղաքականություն',
    ok: 'Հասկանալի է',
  },
};
