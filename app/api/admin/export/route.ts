import { adminRoute } from '@/lib/admin-api';
import { exportQuestions } from '@/lib/questions-io';

export const dynamic = 'force-dynamic';

export const GET = () =>
  adminRoute({ mutating: false }, async () => {
    const doc = await exportQuestions();
    return new Response(JSON.stringify(doc, null, 1), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="dgt-questions-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  });
