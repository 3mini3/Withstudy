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
    <div className="min-h-screen bg-muted/20 text-foreground lg:flex">
      <StudentSidebar email={student.email} />
      <main className="flex-1 overflow-y-auto bg-background px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">{children}</div>
      </main>
    </div>
  );
}
