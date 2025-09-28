import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RegisterForm from '../_components/RegisterForm';

export const metadata: Metadata = {
  title: '新規登録 | Withstady Tutor'
};

export default function RegisterPage() {
  const sessionCookie = cookies().get('withstady-session');

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value) as { email?: unknown };
      if (typeof parsed?.email === 'string' && parsed.email.trim()) {
        redirect('/');
      }
    } catch (error) {
      // Ignore parse errors and continue showing the register form.
    }
  }

  return <RegisterForm />;
}
