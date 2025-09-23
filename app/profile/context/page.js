import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '../../../lib/prisma';
import ContextEditorForm from '../../_components/ContextEditorForm';
import { ensureStudentContextDocument } from '../../../lib/studentContext';

export const metadata = {
  title: 'パーソナライズドドキュメント | Withstady Tutor'
};

export default async function ContextEditorPage() {
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
    // ignore and fallback to redirect below
  }

  if (!email) {
    redirect('/login');
  }

  const student = await prisma.student.findUnique({
    where: { email },
    include: { contextDocument: true }
  });

  if (!student) {
    redirect('/login');
  }

  const content = await ensureStudentContextDocument(student);

  return <ContextEditorForm initialContent={content || ''} />;
}
