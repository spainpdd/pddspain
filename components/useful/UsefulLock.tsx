import Link from 'next/link';
import { Lock } from 'lucide-react';

/** Заглушка раздела «Полезно» для тех, у кого нет оплаченного доступа */
export default function UsefulLock() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Полезно</h1>
      <div className="card mt-6 p-6 text-center" data-testid="useful-locked">
        <Lock className="mx-auto mb-3 text-slate-400" />
        <p className="font-semibold text-slate-800">Раздел для учеников с доступом</p>
        <p className="mt-1.5 text-sm text-slate-500">Здесь собраны инструкции: медсправка, запись на экзамен, обмен прав из других стран.</p>
        <Link href="/pay" className="btn btn-primary mt-5 w-full">Открыть доступ</Link>
      </div>
    </div>
  );
}
