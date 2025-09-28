'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
}

export default function StudentNav({ email }: StudentNavProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <div className="student-sidebar-content">
      <nav className="student-nav" aria-label="学習メニュー">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? 'student-nav-item active' : 'student-nav-item'}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="student-account" aria-label="アカウント操作">
        <p className="student-account-email">{email}</p>
        <Link href="/profile" className="student-account-link">
          プロフィールを編集
        </Link>
        <button
          type="button"
          className="student-account-logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'ログアウト中…' : 'ログアウト'}
        </button>
      </div>
    </div>
  );
}
