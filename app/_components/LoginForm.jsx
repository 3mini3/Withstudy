'use client';

import { useFormState } from 'react-dom';
import { loginAction } from '../_actions/authenticate';

const INITIAL_STATE = { error: '' };

export default function LoginForm() {
  const [state, formAction] = useFormState(loginAction, INITIAL_STATE);

  return (
    <main className="page auth-page">
      <section className="auth-card">
        <h1>Withstady ログイン</h1>
        <p className="auth-subtitle">登録済みのユーザー名とパスワードでサインインしてください。</p>
        <form action={formAction} className="auth-form">
          <label htmlFor="username">ユーザー名</label>
          <input id="username" name="username" type="text" autoComplete="username" required />

          <label htmlFor="password">パスワード</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />

          {state?.error ? <p className="auth-error">{state.error}</p> : null}

          <button type="submit">ログイン</button>
        </form>
      </section>
    </main>
  );
}
