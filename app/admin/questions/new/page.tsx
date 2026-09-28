import { listTopics } from '@/lib/repo/admin';
import QuestionEditor from '@/components/admin/QuestionEditor';

export default async function NewQuestion() {
  const topics = (await listTopics()).filter((t) => t.topic).map((t) => t.topic!);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Новый вопрос</h1>
      <QuestionEditor topics={topics} initial={{ correct: 'a', image_url: '', topic: '', rights_status: 'own', source: 'manual', is_active: true, i18n: {} }} />
    </div>
  );
}
