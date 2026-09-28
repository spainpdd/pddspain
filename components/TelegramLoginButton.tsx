'use client';

import { useEffect, useRef } from 'react';

/** Официальный Telegram Login Widget. После входа Telegram возвращает пользователя на /api/auth/telegram */
export default function TelegramLoginButton({ bot }: { bot: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !bot) return;
    el.innerHTML = '';
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', bot);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-radius', '14');
    s.setAttribute('data-userpic', 'false');
    s.setAttribute('data-request-access', 'write'); // разрешение боту писать пользователю
    s.setAttribute('data-auth-url', '/api/auth/telegram');
    el.appendChild(s);
  }, [bot]);
  return <div ref={ref} className="flex min-h-[44px] justify-center" data-testid="tg-widget" />;
}
