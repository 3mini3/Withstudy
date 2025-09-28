'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { loginAction } from '../_actions/authenticate';

type LoginFormState = {
  error?: string;
};

const INITIAL_STATE: LoginFormState = {};

export default function LoginForm() {
  const [state, formAction] = useFormState<LoginFormState, FormData>(loginAction, INITIAL_STATE);

  return (
    <main className="page auth-page">
      <section className="auth-card">
        <h1>Withstady ログイン</h1>
        <p className="auth-subtitle">登録済みのメールアドレスとパスワードを入力してください。</p>
        <form action={formAction} className="auth-form">
          <label htmlFor="email">メールアドレス</label>
          <input id="email" name="email" type="email" autoComplete="email" required />

          <label htmlFor="password">パスワード</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />

          {state?.error ? <p className="auth-error">{state.error}</p> : null}

          <button type="submit">ログイン</button>
        </form>
        <p className="auth-footnote">
          アカウントをお持ちでない場合は{' '}
          <Link href="/register">新規登録</Link>
          へ進んでください。
        </p>
      </section>
    </main>
  );
}
