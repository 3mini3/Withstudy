'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const DEFAULT_USERNAME = process.env.AUTH_USERNAME || 'student';
const DEFAULT_PASSWORD = process.env.AUTH_PASSWORD || 'study123';

export async function loginAction(prevState, formData) {
  const username = formData.get('username')?.toString().trim() || '';
  const password = formData.get('password')?.toString() || '';

  if (!username || !password) {
    return { error: 'ユーザー名とパスワードを入力してください。' };
  }

  if (username !== DEFAULT_USERNAME || password !== DEFAULT_PASSWORD) {
    return { error: 'ユーザー名またはパスワードが正しくありません。' };
  }

  cookies().set({
    name: 'withstady-session',
    value: JSON.stringify({ username }),
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  });

  redirect('/');
}
