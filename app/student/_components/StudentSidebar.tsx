'use client';

import { useEffect, useState } from 'react';
import StudentNav from './StudentNav';

interface StudentSidebarProps {
  email: string;
}

const MOBILE_BREAKPOINT = 1024;

export default function StudentSidebar({ email }: StudentSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in event ? event.matches : event.currentTarget?.matches ?? false;
      setIsOpen(!matches);
    };

    handleChange(mediaQuery);

    const listener = (event: MediaQueryListEvent) => handleChange(event);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      return () => {
        mediaQuery.removeEventListener('change', listener);
      };
    }

    mediaQuery.addListener(listener);
    return () => {
      mediaQuery.removeListener(listener);
    };
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar-fab${isOpen ? ' open' : ''}`}
        aria-label={isOpen ? 'メニューを折りたたむ' : 'メニューを開く'}
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        {isOpen ? '閉じる' : 'メニュー'}
      </button>
      <aside className={`student-sidebar ${isOpen ? 'open' : 'collapsed'}`} aria-label="学習メニュー">
        <div className="sidebar-controls">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={isOpen ? 'サイドバーを折りたたむ' : 'サイドバーを開く'}
            aria-expanded={isOpen}
            onClick={handleToggle}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>
        <div className="student-sidebar-inner">
          <div className="student-sidebar-top">
            <h1 className="student-logo">Withstady</h1>
            <p className="student-tagline">学習を見える化しながら AI チューターと学び続けましょう。</p>
          </div>
          <StudentNav email={email} />
        </div>
      </aside>
    </>
  );
}
