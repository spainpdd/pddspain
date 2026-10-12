'use client';

import { useEffect, useState } from 'react';
import { applyTheme, readPref, savePref, type ThemePref } from '@/lib/theme';
import { cn } from '@/lib/utils';

const OPTIONS: { id: ThemePref; label: string }[] = [
  { id: 'auto', label: 'Авто' },
  { id: 'light', label: 'Светлая' },
  { id: 'dark', label: 'Тёмная' },
];

export default function ThemeSwitcher() {
  const [pref, setPref] = useState<ThemePref>('auto');
  useEffect(() => setPref(readPref()), []);
  const choose = (p: ThemePref) => {
    setPref(p);
    savePref(p);
    applyTheme();
  };
  return (
    <div className="card space-y-2 p-4">
      <div className="flex gap-1 rounded-xl bg-ink p-1" role="radiogroup" aria-label="Тема оформления">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={pref === o.id}
            onClick={() => choose(o.id)}
            data-testid={`theme-${o.id}`}
            className={cn('flex-1 rounded-lg py-2 text-sm font-semibold transition', pref === o.id ? 'bg-brand-600 text-white' : 'text-slate-400')}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">Авто: тёмная тема включается в 21:00 и выключается в 07:00 по времени на вашем устройстве.</p>
    </div>
  );
}
