/**
 * Сквозная проверка через настоящий браузер (Playwright + Chromium) против запущенного приложения.
 *   E2E_BASE=http://localhost:3100 CHROMIUM=/path/to/chrome node e2e/smoke.mjs
 * Требует: ENABLE_DEV_LOGIN=true, ADMIN_TELEGRAM_IDS=9001, БД с демо-набором (npm run db:seed -- --tests 3).
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.E2E_BASE || 'http://localhost:3100';
const SHOTS = process.env.E2E_SHOTS || '';
const seed = JSON.parse(fs.readFileSync('data/seed-questions.json', 'utf8')).questions;
const correctByEs = new Map(seed.map((q) => [q.i18n.es.text, q.correct]));
const ruByEs = new Map(seed.map((q) => [q.i18n.es.text, q.i18n.ru.text]));

let passed = 0;
const ok = (cond, msg) => {
  if (!cond) throw new Error('FAIL: ' + msg);
  passed++;
  console.log('  ✓ ' + msg);
};
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png` });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, locale: 'ru-RU' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !/favicon|Failed to load resource|Failed to fetch RSC payload/.test(m.text()) && errors.push(m.text()));

/** Проходит текущий тест: wrong — сколько вопросов ответить неверно (первые wrong штук) */
async function playRun(wrong, { limit = 999 } = {}) {
  let n = 0;
  for (;;) {
    const text = (await page.getByTestId('q-text').textContent())?.trim();
    const right = correctByEs.get(text);
    if (!right) throw new Error('неизвестный вопрос: ' + text);
    const pick = n < wrong ? ['a', 'b', 'c'].find((x) => x !== right) : right;
    await page.getByTestId(`opt-${pick}`).click();
    await page.getByTestId('explanation').waitFor();
    n++;
    if (n >= limit) return n;
    await page.getByTestId('next').click();
    if (!(await page.getByTestId('q-text').isVisible().catch(() => false))) {
      // после последнего вопроса открывается экран результата
      await page.waitForTimeout(150);
      if (!(await page.getByTestId('q-text').isVisible().catch(() => false))) return n;
    }
    if (await page.getByTestId('counter').textContent().then((t) => t.startsWith('1 /') && n > 1).catch(() => false)) return n;
  }
}

try {
  console.log('Лендинг и вход');
  await page.goto(BASE + '/');
  ok(await page.getByText('Сдайте теорию DGT').isVisible(), 'лендинг открывается');
  ok(await page.getByText('50 €').first().isVisible(), 'на лендинге виден тариф');
  await shot(page, '01-landing');
  await page.goto(BASE + '/dashboard');
  ok(page.url().endsWith('/login'), 'без входа /dashboard перекидывает на /login');
  await shot(page, '02-login');
  await page.getByTestId('dev-login').click();
  await page.waitForURL('**/dashboard');
  ok(await page.getByTestId('stat-answers').textContent() === '0', 'после входа: 0 ответов');
  await shot(page, '03-dashboard');

  console.log('Список тестов');
  await page.goto(BASE + '/test');
  ok((await page.getByTestId('test-official-1').getAttribute('data-status')) === 'available', 'тест 1 доступен');
  ok((await page.getByTestId('test-official-2').getAttribute('data-status')) === 'locked', 'тест 2 закрыт');
  await shot(page, '04-tests');

  console.log('Тест 1: 2 ошибки → сдан, разбор ошибок, следующий открыт');
  await page.getByTestId('test-official-1').click();
  await page.getByTestId('q-text').waitFor();
  ok((await page.getByTestId('counter').textContent()).trim() === '1 / 30', 'счётчик 1 / 30');
  ok(!(await page.getByTestId('explanation').isVisible().catch(() => false)), 'пояснение скрыто до ответа');
  // перевод в любой момент
  await page.getByTestId('trans-ru').click();
  const esText = (await page.getByTestId('q-text').textContent()).trim();
  ok((await page.getByTestId('q-text-tr').textContent()).trim() === ruByEs.get(esText), 'перевод на RU показывается под вопросом');
  await page.getByTestId('trans-hy').click();
  ok(/[Ա-֏]/.test(await page.getByTestId('q-text-tr').textContent()), 'переключение на армянский работает');
  await page.getByTestId('trans-hy').click();
  ok(!(await page.getByTestId('q-text-tr').isVisible().catch(() => false)), 'перевод выключается повторным нажатием');
  await page.getByTestId('study-en').click();
  ok((await page.getByTestId('q-text').textContent()).trim() !== esText, 'язык изучения переключается на EN');
  await page.getByTestId('study-es').click();
  // ответ + пояснение сразу
  const right = correctByEs.get(esText);
  const wrongOpt = ['a', 'b', 'c'].find((x) => x !== right);
  await page.getByTestId(`opt-${wrongOpt}`).click();
  ok(await page.getByTestId('explanation').isVisible(), 'после ответа сразу открывается пояснение');
  ok((await page.getByTestId(`opt-${right}`).getAttribute('data-state')) === 'right', 'правильный вариант подсвечен зелёным');
  ok((await page.getByTestId(`opt-${wrongOpt}`).getAttribute('data-state')) === 'wrong', 'выбранный неверный — красным');
  ok((await page.getByTestId('err-chip').textContent()).includes('1'), 'счётчик ошибок = 1');
  await shot(page, '05-question-wrong');
  await page.getByTestId('trans-ru').click();
  ok(await page.getByTestId('explanation-tr').isVisible(), 'перевод пояснения показывается');
  await shot(page, '06-question-translated');
  await page.getByTestId('next').click();

  // сохранение хода при обновлении
  await page.getByTestId('q-text').waitFor();
  const t2 = (await page.getByTestId('q-text').textContent()).trim();
  await page.getByTestId(`opt-${correctByEs.get(t2)}`).click();
  await page.reload();
  await page.getByTestId('q-text').waitFor();
  ok((await page.getByTestId('counter').textContent()).trim() === '2 / 30', 'после перезагрузки страницы ход теста сохранён (2 / 30)');
  ok(await page.getByTestId('explanation').isVisible(), '…и ответ на текущий вопрос тоже');
  await page.getByTestId('next').click();

  // остальные 28: одна ещё ошибка (всего 2)
  {
    let n = 2;
    for (;;) {
      const text = (await page.getByTestId('q-text').textContent()).trim();
      const r = correctByEs.get(text);
      const pick = n === 2 ? ['a', 'b', 'c'].find((x) => x !== r) : r;
      await page.getByTestId(`opt-${pick}`).click();
      n++;
      await page.getByTestId('next').click();
      if (n === 29) break;
    }
    // цикл завершился после 29-го ответа — отвечаем 30-й
    const text = (await page.getByTestId('q-text').textContent()).trim();
    await page.getByTestId(`opt-${correctByEs.get(text)}`).click();
    ok((await page.getByTestId('next').textContent()).includes('Завершить'), 'на последнем вопросе кнопка «Завершить тест»');
    await page.getByTestId('next').click();
  }
  await page.getByTestId('result-title').waitFor();
  ok((await page.getByTestId('result-title').textContent()) === 'Тест сдан', 'результат: «Тест сдан» при 2 ошибках');
  ok((await page.getByTestId('result-text').textContent()).includes('Ошибок: 2'), 'указано число ошибок');
  await shot(page, '07-result-pass');
  await page.getByRole('button', { name: /Решить ошибки \(2\)/ }).click();
  await page.getByTestId('q-text').waitFor();
  ok((await page.getByTestId('counter').textContent()).trim() === '1 / 2', 'разбор: ровно эти 2 вопроса');
  for (let i = 0; i < 2; i++) {
    const text = (await page.getByTestId('q-text').textContent()).trim();
    await page.getByTestId(`opt-${correctByEs.get(text)}`).click();
    await page.getByTestId('next').click();
  }
  await page.getByText('Тест 1 сдан').waitFor();
  ok(true, 'после разбора: «Тест 1 сдан», ошибки сохранены в раздел');
  await page.getByRole('button', { name: /^Тест 2$/ }).click();
  await page.waitForURL(/\/(test\/official\/2|pay)/);
  ok(true, 'кнопка ведёт на следующий тест 2');

  console.log('Платный доступ: бесплатно только тест 1');
  await page.goto(BASE + '/test/official/2');
  ok(page.url().includes('/pay'), 'тест 2 без подписки перекидывает на оплату');
  ok(await page.getByTestId('pay-btn').isDisabled(), 'кнопка оплаты неактивна без согласия');
  await shot(page, '10-pay');
  await page.goto(BASE + '/errors');
  ok(await page.getByText('Раздел ошибок доступен с подпиской').isVisible(), '«Ошибки» закрыты без подписки');

  console.log('Админка: выдача доступа');
  await page.goto(BASE + '/admin/users');
  await page.getByTestId('user-row').first().getByRole('button', { name: '+' }).click();
  await page.waitForTimeout(600);
  await page.goto(BASE + '/test/official/2');
  ok(page.url().endsWith('/test/official/2'), 'после выдачи доступа тест 2 открывается');

  console.log('Тест 2: 3 ошибки → следующий закрыт, пересдача');
  await page.getByTestId('q-text').waitFor();
  {
    let n = 0;
    for (;;) {
      const text = (await page.getByTestId('q-text').textContent()).trim();
      const r = correctByEs.get(text);
      const pick = n < 3 ? ['a', 'b', 'c'].find((x) => x !== r) : r;
      await page.getByTestId(`opt-${pick}`).click();
      n++;
      await page.getByTestId('next').click();
      if (n === 30) break;
      if (n === 29) {
        const t = (await page.getByTestId('q-text').textContent()).trim();
        await page.getByTestId(`opt-${correctByEs.get(t)}`).click();
        n++;
        await page.getByTestId('next').click();
        break;
      }
    }
  }
  await page.getByTestId('result-title').waitFor();
  ok((await page.getByTestId('result-title').textContent()) === 'Слишком много ошибок', 'при 3 ошибках: «Слишком много ошибок»');
  await shot(page, '08-result-fail');
  await page.getByRole('button', { name: 'К списку тестов' }).click();
  await page.waitForURL('**/test');
  ok((await page.getByTestId('test-official-2').getAttribute('data-status')) === 'available', 'тест 2 остаётся доступным (не сдан)');
  ok((await page.getByTestId('test-official-3').getAttribute('data-status')) === 'locked', 'тест 3 закрыт, пока в тесте 2 больше 2 ошибок');
  await page.goto(BASE + '/test/official/3');
  ok(page.url().endsWith('/test'), 'прямой заход на закрытый тест 3 перекидывает на список');

  console.log('Пересдача теста 2 без ошибок');
  await page.goto(BASE + '/test/official/2');
  await page.getByTestId('q-text').waitFor();
  for (let i = 0; i < 30; i++) {
    const text = (await page.getByTestId('q-text').textContent()).trim();
    await page.getByTestId(`opt-${correctByEs.get(text)}`).click();
    await page.getByTestId('next').click();
  }
  await page.getByTestId('result-title').waitFor();
  ok((await page.getByTestId('result-title').textContent()) === 'Без ошибок!', 'пересдача без ошибок → «Без ошибок!»');
  await shot(page, '09-result-perfect');
  await page.goto(BASE + '/test');
  ok((await page.getByTestId('test-official-3').getAttribute('data-status')) === 'available', 'тест 3 открылся');

  console.log('Раздел «Ошибки»');
  await page.goto(BASE + '/errors');
  await page.getByTestId('q-text').waitFor();
  ok((await page.getByTestId('counter').textContent()).trim() === '1 / 5', 'после выдачи доступа «Ошибки» дают 5 вопросов');
  for (let i = 0; i < 5; i++) {
    const text = (await page.getByTestId('q-text').textContent()).trim();
    const r = correctByEs.get(text);
    await page.getByTestId(`opt-${i < 2 ? ['a', 'b', 'c'].find((x) => x !== r) : r}`).click();
    await page.getByTestId('next').click();
  }
  await page.getByTestId('errors-summary').waitFor();
  const sum = await page.getByTestId('errors-summary').textContent();
  ok(sum.includes('Верно 3 из 5'), 'итог ошибок: верно 3 из 5');
  await shot(page, '11-errors-summary');
  await page.getByTestId('more-errors').click();
  await page.getByTestId('q-text').waitFor();
  ok(true, '«Ещё» подгружает следующую пачку');
  await page.goto(BASE + '/dashboard');
  ok(Number(await page.getByTestId('stat-answers').textContent()) > 60, 'счётчик «Всего ответов» растёт');
  await shot(page, '12-dashboard-after');

  console.log('Админка: редактирование вопроса и тем');
  await page.goto(BASE + '/admin/questions');
  ok((await page.getByTestId('q-row').count()) === 30, 'в списке 30 вопросов');
  await page.locator('input[name=q]').fill('135 cm');
  await page.getByRole('button', { name: 'Показать' }).click();
  await page.waitForURL(/q=135/);
  ok((await page.getByTestId('q-row').count()) === 1, 'поиск по тексту находит вопрос про 135 см');
  await shot(page, '13-admin-list');
  await page.getByTestId('q-row').first().getByRole('link').first().click();
  await page.getByTestId('editor').waitFor();
  const oldCorrectBtn = page.getByTestId('correct-a');
  await page.getByTestId('t-text').fill('EDITADO: ¿Cuál es la estatura máxima para usar SRI?');
  await page.getByTestId('topic').fill('sri-tema');
  await page.getByTestId('tab-ru').click();
  await page.getByTestId('t-text').fill('ПРАВЛЕНО: какой рост требует детского кресла?');
  await page.getByTestId('tab-hy').click();
  ok((await page.getByTestId('t-text').inputValue()).length > 0, 'вкладка HY содержит армянский перевод');
  await shot(page, '14-admin-editor');
  await page.getByTestId('save').click();
  await page.getByTestId('save-msg').waitFor();
  ok((await page.getByTestId('save-msg').textContent()) === 'Сохранено', 'вопрос сохранён');
  void oldCorrectBtn;
  // правка видна пользователю в тесте
  await page.goto(BASE + '/test/official/1');
  let found = false;
  for (let i = 0; i < 30 && !found; i++) {
    const text = (await page.getByTestId('q-text').textContent()).trim();
    if (text.startsWith('EDITADO')) { found = true; break; }
    await page.getByTestId('opt-a').click();
    await page.getByTestId('next').click();
  }
  ok(found, 'правка формулировки сразу видна в тесте у пользователя');
  await page.goto(BASE + '/admin/topics');
  ok((await page.getByTestId('topic-row').count()) >= 5, 'страница тем показывает список тем');
  const row = page.getByTestId('topic-row').filter({ hasText: 'sri-tema' });
  await row.getByTestId('topic-input').fill('seguridad');
  await row.getByTestId('topic-save').click();
  await page.waitForTimeout(600);
  await page.reload();
  ok((await page.getByTestId('topic-row').filter({ hasText: 'sri-tema' }).count()) === 0, 'тема переименована/объединена');
  await page.goto(BASE + '/admin/data');
  const resp = await page.request.get(BASE + '/api/admin/export');
  const exp = await resp.json();
  ok(exp.questions.length === 30 && exp.tests.length === 3, 'экспорт: 30 вопросов и 3 теста');
  ok(exp.questions.some((q) => q.i18n.es.text.startsWith('EDITADO')), 'экспорт содержит свежую правку');

  console.log('Безопасность');
  const anon = await browser.newContext();
  const ap = await anon.newPage();
  ok((await ap.request.post(BASE + '/api/tests/official/1/submit', { data: { answers: {} } })).status() === 401, 'API без входа → 401');
  ok((await ap.request.get(BASE + '/api/admin/export')).status() === 401, 'экспорт без входа → 401');
  ok((await ap.request.post(BASE + '/api/telegram/webhook', { data: {} })).status() === 403, 'вебхук бота без секрета → 403');
  ok((await ap.request.get(BASE + '/api/cron/daily')).status() === 403, 'cron без секрета → 403');
  ok((await ap.request.get(BASE + '/api/auth/telegram?id=1&hash=00')).url().includes('/login?error='), 'подделанный вход Telegram отклоняется');
  const csrf = await ctx.request.post(BASE + '/api/me', { method: 'PATCH', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, data: { notify: false } });
  ok(csrf.status() === 403 || csrf.status() === 405, 'запрос с чужого Origin отклоняется');
  await anon.close();

  console.log('Профиль');
  await page.goto(BASE + '/profile');
  ok(await page.getByText('Гарантия «до сдачи»').isVisible().catch(() => false) === false, 'блок гарантии скрыт, пока нет оплаты (ручная выдача дней гарантию не включает)');
  await shot(page, '15-profile');

  ok(errors.length === 0, 'в консоли браузера нет ошибок' + (errors.length ? ': ' + errors.join(' | ') : ''));
  console.log(`\nВсё прошло: ${passed} проверок`);
} catch (e) {
  console.error('\n' + e.message);
  await shot(page, 'FAIL');
  console.error('URL:', page.url());
  process.exitCode = 1;
} finally {
  await browser.close();
}
