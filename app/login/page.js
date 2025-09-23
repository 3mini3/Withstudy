import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from '../_components/LoginForm';

export const metadata = {
  title: 'ログイン | Withstady Tutor'
};

export default function LoginPage() {
  const sessionCookie = cookies().get('withstady-session');

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      if (typeof parsed?.username === 'string' && parsed.username.trim()) {
        redirect('/');
      }
    } catch (error) {
      // Ignore parse errors and continue showing the login form.
    }
  }

  return <LoginForm />;
}
