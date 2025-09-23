import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ChatDashboard from './_components/ChatDashboard';

export default function HomePage() {
  const sessionCookie = cookies().get('withstady-session');

  if (!sessionCookie?.value) {
    redirect('/login');
  }

  let username = '';
  try {
    const parsed = JSON.parse(sessionCookie.value);
    if (typeof parsed?.username === 'string' && parsed.username.trim()) {
      username = parsed.username.trim();
    }
  } catch (error) {
    console.error('Failed to parse session cookie', error);
  }

  if (!username) {
    redirect('/login');
  }

  return <ChatDashboard username={username} />;
}
