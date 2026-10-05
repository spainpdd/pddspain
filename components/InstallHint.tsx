'use client';

import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

/** Подсказка «Установить приложение»: Android/Chrome — системный запрос, iOS — инструкция */
export default function InstallHint() {
  const [evt, setEvt] = useState<any>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem('dgt:install-dismissed') === '1';
    } catch {}
    if (standalone || dismissed) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setHidden(false);
    const h = (e: Event) => {
      e.preventDefault();
      setEvt(e);
    };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  if (hidden || (!evt && !ios)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem('dgt:install-dismissed', '1');
    } catch {}
    setHidden(true);
  };

  return (
    <div className="card mt-6 flex items-center gap-3 p-4 text-sm">
      {ios ? <Share size={20} className="shrink-0 text-brand-400" /> : <Download size={20} className="shrink-0 text-brand-400" />}
      <div className="flex-1 text-slate-700">
        {ios ? 'Установите как приложение: «Поделиться» → «На экран “Домой”».' : 'Установите на телефон — откроется как обычное приложение.'}
      </div>
      {evt && (
        <button className="btn btn-primary btn-sm" onClick={() => evt.prompt()}>
          Установить
        </button>
      )}
      <button className="text-xs text-slate-500" onClick={dismiss} aria-label="Скрыть">
        ✕
      </button>
    </div>
  );
}
