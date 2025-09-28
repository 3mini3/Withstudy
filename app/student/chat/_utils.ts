import type { Student } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '../../../lib/prisma';

export type ClientStudent = Pick<Student, 'email' | 'grade' | 'favoriteSubject' | 'mockExamScore'>;

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

export async function loadClientStudent(): Promise<ClientStudent> {
  const email = parseSessionEmail();

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

  return {
    email: student.email,
    grade: student.grade,
    favoriteSubject: student.favoriteSubject,
    mockExamScore: student.mockExamScore
  };
}
