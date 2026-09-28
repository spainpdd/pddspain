/**
 * Конвертирует выгрузку LordOkami/dgt-b-scrapper (или похожие JSON) в формат dgt-pwa/questions@1.
 * Запускайте на своём компьютере, в папке проекта, указав путь к клону репозитория:
 *
 *   npm run lordokami:convert -- ../dgt-b-scrapper/data/todotest_b [--out data/lordokami.json]
 *        [--index-base 0|1] [--copy-images public/q-images] [--no-tests] [--no-images]
 *
 * Дальше:
 *   npm run questions:import -- data/lordokami.json        (вопросы получают статус unverified)
 *   В .env.local:  SERVE_UNVERIFIED_QUESTIONS=true          (чтобы видеть их в приложении локально)
 */
import fs from 'node:fs';
import path from 'node:path';
import { convert, findQuestionObjects, inferTests, type RawQuestion } from '../lib/convert-lordokami';
import { FORMAT } from '../lib/questions-io';
import { convertTodotest } from '../lib/convert-todotest';

function walk(p: string, out: string[] = []) {
  const st = fs.statSync(p);
  if (st.isDirectory()) for (const f of fs.readdirSync(p).sort()) walk(path.join(p, f), out);
  else if (p.toLowerCase().endsWith('.json')) out.push(p);
  return out;
}

const args = process.argv.slice(2);
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const input = args.find((a) => !a.startsWith('--') && a !== opt('--out') && a !== opt('--index-base') && a !== opt('--copy-images'));
if (!input) {
  console.error('Укажите файл или папку с JSON: npm run lordokami:convert -- <путь>');
  process.exit(1);
}
const out = opt('--out') ?? 'data/lordokami.json';
const ib = opt('--index-base');
const copyImages = opt('--copy-images');

// --- Точный режим: папка data/todotest_b из LordOkami/dgt-b-scrapper (tests/test_NNN.json + images/) ---
{
  const root = path.resolve(input);
  const testsDir = path.join(root, 'tests');
  if (fs.existsSync(testsDir) && fs.statSync(testsDir).isDirectory() && fs.readdirSync(testsDir).some((f) => /^test_\d+\.json$/.test(f))) {
    const raw = fs.readdirSync(testsDir).filter((f) => /^test_\d+\.json$/.test(f)).sort()
      .map((f) => JSON.parse(fs.readFileSync(path.join(testsDir, f), 'utf8')));
    const imgDir = copyImages ?? 'public/q-images';
    if (!args.includes('--no-images')) fs.mkdirSync(imgDir, { recursive: true });
    let copied = 0;
    const res = convertTodotest(raw, {
      imageUrl: (file) => {
        const name = path.basename(file);
        if (args.includes('--no-images')) return '/q-images/' + name;
        const src = [path.join(root, file), path.join(root, 'images', name)].find((c) => fs.existsSync(c));
        if (src) { fs.copyFileSync(src, path.join(imgDir, name)); copied++; }
        return '/' + path.relative('public', path.join(imgDir, name)).replace(/\\/g, '/');
      },
    });
    const doc: any = { format: FORMAT, questions: res.questions };
    if (!args.includes('--no-tests')) doc.tests = res.tests;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(doc, null, 1));
    const r = res.report;
    console.log(`Формат: todotest_b (точный режим)`);
    console.log(`Тестов: ${r.tests}, слотов: ${r.slots}, уникальных вопросов: ${r.questions}`);
    console.log(`С картинкой: ${r.withImage} (файлов скопировано: ${copied} → ${imgDir}), с двумя вариантами ответа: ${r.twoOptions}`);
    const topics = new Map<string, number>();
    res.questions.forEach((q) => topics.set(q.topic ?? '—', (topics.get(q.topic ?? '—') ?? 0) + 1));
    console.log('Темы (авто-разметка, правится в админке):', [...topics].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}: ${n}`).join(', '));
    if (r.skipped.length) console.log('Пропущено:', r.skipped.length, r.skipped.slice(0, 5));
    console.log('Пояснений в этой выгрузке нет — их нужно написать/сгенерировать отдельно.');
    console.log(`\nГотово → ${out}`);
    process.exit(0);
  }
}

const files = walk(path.resolve(input));
const raws: RawQuestion[] = [];
for (const f of files) {
  try {
    findQuestionObjects(JSON.parse(fs.readFileSync(f, 'utf8')), path.relative(path.resolve(input), f) || path.basename(f), raws);
  } catch {
    console.log(`  (пропущен нечитаемый файл ${f})`);
  }
}

const { questions, report, refByFileKey } = convert(raws, { indexBase: ib === '0' ? 0 : ib === '1' ? 1 : undefined });

if (copyImages) {
  fs.mkdirSync(copyImages, { recursive: true });
  const base = path.resolve(input);
  const root = fs.statSync(base).isDirectory() ? base : path.dirname(base);
  let copied = 0;
  for (const q of questions) {
    if (!q.image_url || /^https?:/.test(q.image_url)) continue;
    const cand = [path.resolve(root, q.image_url), path.resolve(root, 'images', path.basename(q.image_url)), path.resolve(root, '..', q.image_url)];
    const src = cand.find((c) => fs.existsSync(c));
    if (!src) continue;
    const name = path.basename(src);
    fs.copyFileSync(src, path.join(copyImages, name));
    q.image_url = '/' + path.relative('public', path.join(copyImages, name)).replace(/\\/g, '/');
    copied++;
  }
  console.log(`Картинок скопировано: ${copied}`);
}

const tests = args.includes('--no-tests') ? [] : inferTests(refByFileKey);
const doc: any = { format: FORMAT, questions };
if (tests.length) doc.tests = tests.map((t) => ({ ...t, source: 'lordokami' }));

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(doc, null, 1));

console.log(`Файлов JSON: ${files.length}`);
console.log(`Найдено похожих на вопрос: ${report.found}`);
console.log(`Сконвертировано: ${report.converted}, дубликатов: ${report.duplicates}, пропущено: ${report.skipped.length}`);
if (report.indexBase !== 'n/a') console.log(`Нумерация вариантов: с ${report.indexBase}`);
report.warnings.forEach((w) => console.log('!', w));
const reasons = new Map<string, number>();
report.skipped.forEach((s) => reasons.set(s.reason, (reasons.get(s.reason) ?? 0) + 1));
[...reasons].forEach(([r, n]) => console.log(`  пропущено ${n}: ${r}`));
report.skipped.slice(0, 3).forEach((s) => console.log(`   пример: [${s.file}] ${s.sample}`));
console.log(tests.length ? `Тесты: распознано ${tests.length} (файл = тест из 30 вопросов)` : 'Состав тестов не определён — соберите их командой: npm run tests:build');
if (questions[0]) console.log('\nПервый вопрос после конвертации:\n', JSON.stringify(questions[0].i18n.es, null, 1));
console.log(`\nГотово → ${out}`);
if (!report.converted) console.log('Ничего не распознано: пришлите 2–3 записи из ваших файлов, поправлю список полей.');
