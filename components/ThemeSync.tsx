'use client';

import { useEffect } from 'react';
import { applyTheme } from '@/lib/theme';

/** Держит тему в актуальном состоянии: в 21:00 приложение само темнеет, в 07:00 светлеет, даже если вкладка открыта */
export default function ThemeSync() {
  useEffect(() => {
    const tick = () => applyTheme();
    const timer = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('storage', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('storage', tick);
    };
  }, []);
  return null;
}
