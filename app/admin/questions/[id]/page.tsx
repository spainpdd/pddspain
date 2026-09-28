import { notFound } from 'next/navigation';
import { getQuestionFull, listTopics } from '@/lib/repo/admin';
import QuestionEditor, { type EditorInitial } from '@/components/admin/QuestionEditor';

export default async function EditQuestion({ params }: { params: { id: string } }) {
  const [full, topics] = await Promise.all([getQuestionFull(params.id), listTopics()]);
  if (!full) notFound();
  const { question: q, translations, tests } = full;
  const i18n: EditorInitial['i18n'] = {};
  for (const [lang, t] of Object.entries<any>(translations)) {
    i18n[lang as 'es'] = { text: t.text, a: t.option_a, b: t.option_b, c: t.option_c, explanation: t.explanation ?? '', status: t.status };
  }
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Редактирование вопроса</h1>
      <p className="mb-4 font-mono text-xs text-slate-600">{q.id}</p>
      <QuestionEditor
        topics={topics.filter((t) => t.topic).map((t) => t.topic!)}
        initial={{
          id: q.id, correct: q.correct, image_url: q.image_url ?? '', topic: q.topic ?? '', rights_status: q.rights_status,
          source: q.source ?? '', is_active: q.is_active, i18n, tests: JSON.parse(JSON.stringify(tests)),
        }}
      />
    </div>
  );
}
