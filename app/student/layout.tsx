import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '../../lib/prisma';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

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
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/20 text-foreground">
        <StudentSidebar email={student.email} />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="rounded-md border md:hidden" />
            <p className="text-base font-semibold text-foreground">Withstady</p>
          </header>
          <main className="flex-1 overflow-y-auto bg-background px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
