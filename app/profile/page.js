import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '../../lib/prisma';
import ProfileForm from '../_components/ProfileForm';

export const metadata = {
  title: 'プロフィール設定 | Withstady Tutor'
};

export default async function ProfilePage() {
  const sessionCookie = cookies().get('withstady-session');

  if (!sessionCookie?.value) {
    redirect('/login');
  }

  let email = '';
  try {
    const parsed = JSON.parse(sessionCookie.value);
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

  const clientStudent = {
    email: student.email,
    grade: student.grade,
    favoriteSubject: student.favoriteSubject,
    mockExamScore: student.mockExamScore
  };

  return <ProfileForm student={clientStudent} />;
}
