'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { regenerateContextDocumentAction, saveContextDocumentAction } from '../_actions/contextDocument';

type ContextEditorState = {
  error?: string;
  success?: string;
};

interface ContextEditorFormProps {
  initialContent?: string;
}

const INITIAL_STATE: ContextEditorState = {};

const regenerateAction = regenerateContextDocumentAction.bind(null);

export default function ContextEditorForm({ initialContent = '' }: ContextEditorFormProps) {
  const [state, formAction] = useFormState<ContextEditorState, FormData>(
    saveContextDocumentAction,
    INITIAL_STATE
  );
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [regenerateMessage, setRegenerateMessage] = useState('');

  const handleRegenerate = () => {
    startTransition(async () => {
      setRegenerateMessage('');
      const result = await regenerateAction();
      if (result?.error) {
        setRegenerateMessage(result.error);
        return;
      }
      setContent(result?.content ?? '');
      setRegenerateMessage(result?.success || '再生成しました。');
    });
  };

  return (
    <main className="page profile-page">
      <section className="profile-card context-editor">
        <header className="profile-header">
          <div>
            <h1>パーソナライズドドキュメント</h1>
            <p>チューターが参照する自己紹介文を編集できます。保存すると手動編集扱いになり、プロフィール変更時は追記が自動で追加されます。</p>
          </div>
          <div className="context-actions">
            <button type="button" onClick={handleRegenerate} disabled={isPending} className="secondary-button">
              {isPending ? '再生成中…' : '最新情報で再生成'}
            </button>
            <Link href="/profile" className="profile-skip">
              プロフィールに戻る
            </Link>
          </div>
        </header>

        <form action={formAction} className="context-form">
          <textarea
            name="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={18}
            spellCheck="false"
            className="context-textarea"
          />

          {state?.error ? <p className="profile-error">{state.error}</p> : null}
          {state?.success ? <p className="profile-success">{state.success}</p> : null}
          {regenerateMessage ? <p className="profile-success">{regenerateMessage}</p> : null}

          <div className="profile-footer">
            <button type="submit">保存</button>
          </div>
        </form>
      </section>
    </main>
  );
}
