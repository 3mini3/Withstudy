'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { registerAction } from '../_actions/authenticate';

const INITIAL_STATE = { error: '' };

export default function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, INITIAL_STATE);

  return (
    <main className="page auth-page">
      <section className="auth-card">
        <h1>新規登録</h1>
        <p className="auth-subtitle">Withstady を利用するためのアカウントを作成します。</p>
        <form action={formAction} className="auth-form">
          <label htmlFor="email">メールアドレス</label>
          <input id="email" name="email" type="email" autoComplete="email" required />

          <label htmlFor="password">パスワード（8文字以上）</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required />

          <label htmlFor="confirm-password">パスワード（確認）</label>
          <input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required />

          {state?.error ? <p className="auth-error">{state.error}</p> : null}

          <button type="submit">登録してプロフィール入力へ</button>
        </form>
        <p className="auth-footnote">
          すでにアカウントをお持ちの場合は{' '}
          <Link href="/login">ログイン</Link>
          に戻ってください。
        </p>
      </section>
    </main>
  );
}
