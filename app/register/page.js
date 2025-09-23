import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RegisterForm from '../_components/RegisterForm';

export const metadata = {
  title: '新規登録 | Withstady Tutor'
};

export default function RegisterPage() {
  const sessionCookie = cookies().get('withstady-session');

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      if (typeof parsed?.email === 'string' && parsed.email.trim()) {
        redirect('/');
      }
    } catch (error) {
      // Ignore parse errors and continue showing the register form.
    }
  }

  return <RegisterForm />;
}
