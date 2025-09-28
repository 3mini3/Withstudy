'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/student/dashboard', label: 'ダッシュボード' },
  { href: '/student/chat/math', label: '数学' },
  { href: '/student/chat/science', label: '理科' },
  { href: '/student/chat/english', label: '英語' },
  { href: '/student/chat/social-studies', label: '社会' },
  { href: '/student/chat/japanese', label: '国語' }
];

interface StudentNavProps {
  email: string;
  onNavigate?: () => void;
}

export default function StudentNav({ email, onNavigate }: StudentNavProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleNavigate = () => {
    onNavigate?.();
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to logout', error);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-between gap-10">
      <nav className="space-y-1" aria-label="学習メニュー">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavigate}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary',
                isActive ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ログイン中</p>
          <p className="truncate text-sm font-medium text-foreground">{email}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/profile" onClick={handleNavigate}>
              プロフィールを編集
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'ログアウト中…' : 'ログアウト'}
          </Button>
        </div>
      </div>
    </div>
  );
}
