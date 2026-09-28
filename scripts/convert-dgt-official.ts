/**
 * Официальные вопросы симулятора DGT (из выгрузки LordOkami/dgt-b-scrapper) → dgt-pwa/questions@1.
 *
 *   npm run dgt:convert -- ../dgt-b-scrapper/data [--out data/dgt-official.json]
 *        [--images-dir public/dgt-images] [--first-test 1] [--no-tests]
 * Дальше:  npm run questions:import -- data/dgt-official.json
 * Статус прав — dgt_official (показывается пользователям; в приложении выводится ссылка на источник).
 */
import fs from 'node:fs';
import path from 'node:path';
import { convertDgtOfficial } from '../lib/convert-dgt-official';
import { FORMAT } from '../lib/questions-io';

const args = process.argv.slice(2);
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const skipVals = new Set([opt('--out'), opt('--images-dir'), opt('--first-test')]);
const input = args.find((a) => !a.startsWith('--') && !skipVals.has(a));
if (!input) {
  console.error('Укажите папку data из dgt-b-scrapper: npm run dgt:convert -- ../dgt-b-scrapper/data');
  process.exit(1);
}
const root = path.resolve(input);
const out = opt('--out') ?? 'data/dgt-official.json';
const imagesDir = opt('--images-dir') ?? 'public/dgt-images';

const bankFile = path.join(root, 'question_bank_B.json');
if (!fs.existsSync(bankFile)) {
  console.error(`Не найден ${bankFile}`);
  process.exit(1);
}
const bank = JSON.parse(fs.readFileSync(bankFile, 'utf8'));
const exams = fs
  .readdirSync(root)
  .filter((d) => /^exam_B_\d+$/.test(d) && fs.existsSync(path.join(root, d, 'exam.json')))
  .sort()
  .map((d) => JSON.parse(fs.readFileSync(path.join(root, d, 'exam.json'), 'utf8')));

fs.mkdirSync(imagesDir, { recursive: true });
let copied = 0;
const res = convertDgtOfficial(bank, exams, {
  firstTest: Number(opt('--first-test') ?? 1),
  imageUrl: (q) => {
    if (!q.image_file) return null;
    const src = path.join(root, q.image_file);
    if (!fs.existsSync(src)) return null;
    const name = path.basename(src);
    fs.copyFileSync(src, path.join(imagesDir, name));
    copied++;
    return '/' + path.relative('public', path.join(imagesDir, name)).replace(/\\/g, '/');
  },
});

const doc: any = { format: FORMAT, questions: res.questions };
if (!args.includes('--no-tests')) doc.tests = res.tests;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(doc, null, 1));

console.log(`Экзаменов в выгрузке: ${res.report.exams}, разных экзаменов (тестов): ${res.report.forms}`);
console.log(`Вопросов: ${res.report.questions}, картинок скопировано: ${copied} → ${imagesDir}`);
if (res.report.reordered) console.log(`Вопросов, где в банке индекс ответа расходился с текстом (взят текст): ${res.report.reordered}`);
if (res.report.skipped.length) console.log('Пропущено:', res.report.skipped);
console.log(`Тесты: ${res.tests.map((t) => `№${t.number} (${t.refs.length})`).join(', ') || '—'}`);
console.log(`\nГотово → ${out}`);
