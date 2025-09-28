import type { Metadata } from 'next';
import type { Student } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '../../lib/prisma';
import ProfileForm from '../_components/ProfileForm';

export const metadata: Metadata = {
  title: 'プロフィール設定 | Withstady Tutor'
};

type ClientStudent = Pick<Student, 'email' | 'grade' | 'favoriteSubject' | 'mockExamScore'>;

export default async function ProfilePage() {
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
    // Ignore parsing error and fall through to redirect.
  }

  if (!email) {
    redirect('/login');
  }

  const student = await prisma.student.findUnique({ where: { email } });

  if (!student) {
    redirect('/login');
  }

  const clientStudent: ClientStudent = {
    email: student.email,
    grade: student.grade,
    favoriteSubject: student.favoriteSubject,
    mockExamScore: student.mockExamScore
  };

  return <ProfileForm student={clientStudent} />;
}
