import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '../../lib/prisma';
import StudentSidebar from './_components/StudentSidebar';

interface StudentLayoutProps {
  children: ReactNode;
}

function parseSessionEmail(): string | null {
  const sessionCookie = cookies().get('withstady-session');
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(sessionCookie.value) as { email?: unknown };
    if (typeof parsed?.email === 'string' && parsed.email.trim()) {
      return parsed.email.trim().toLowerCase();
    }
  } catch (error) {
    return null;
  }

  return null;
}

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const email = parseSessionEmail();

  if (!email) {
    redirect('/login');
  }

  const student = await prisma.student.findUnique({ where: { email } });

  if (!student) {
    redirect('/login');
  }

  return (
    <div className="student-shell">
      <StudentSidebar email={student.email} />
      <main className="student-main">{children}</main>
    </div>
  );
}
