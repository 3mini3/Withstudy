import type { Student } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ChatDashboard from './_components/ChatDashboard';
import prisma from '../lib/prisma';

type ClientStudent = Pick<Student, 'email' | 'grade' | 'favoriteSubject' | 'mockExamScore'>;

export default async function HomePage() {
  const sessionCookie = cookies().get('withstady-session');

  if (!sessionCookie?.value) {
    redirect('/login');
  }

  let email = '';
  try {
    const parsed = JSON.parse(sessionCookie.value) as { email?: unknown };
    if (typeof parsed?.email === 'string' && parsed.email.trim()) {
      email = parsed.email.trim().toLowerCase();
    }
  } catch (error) {
    console.error('Failed to parse session cookie', error);
  }

  if (!email) {
    redirect('/login');
  }

  const student = await prisma.student.findUnique({ where: { email } });

  if (!student) {
    redirect('/login');
  }

  if (student.grade == null || student.favoriteSubject == null) {
    redirect('/profile');
  }

  const clientStudent: ClientStudent = {
    email: student.email,
    grade: student.grade,
    favoriteSubject: student.favoriteSubject,
    mockExamScore: student.mockExamScore
  };

  return <ChatDashboard student={clientStudent} />;
}
