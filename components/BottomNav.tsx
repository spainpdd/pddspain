'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, AlertCircle, Lightbulb, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Главная', icon: Home },
  { href: '/test', label: 'Тесты', icon: BookOpen },
  { href: '/errors', label: 'Ошибки', icon: AlertCircle },
  { href: '/useful', label: 'Полезно', icon: Lightbulb },
  { href: '/profile', label: 'Профиль', icon: User },
];

export default function BottomNav({ errorsOpen }: { errorsOpen: number }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  // Layout не перерисовывается при переходах внутри приложения, поэтому счётчик ошибок
  // обновляем вручную, когда пользователь уходит с экранов, где он мог измениться.
  const prev = useRef(pathname);
  useEffect(() => {
    const was = prev.current;
    prev.current = pathname;
    if (was !== pathname && (was.startsWith('/errors') || was.startsWith('/test/'))) router.refresh();
  }, [pathname, router]);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-ink/95 backdrop-blur pb-safe">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn('relative flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]', active ? 'text-brand-600' : 'text-slate-500')}>
              <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
              <span>{label}</span>
              {href === '/errors' && errorsOpen > 0 && (
                <span className="absolute -top-0.5 right-2 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                  {errorsOpen > 99 ? '99+' : errorsOpen}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
