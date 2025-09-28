'use client';

import Link from 'next/link';
import { useFormState } from 'react-dom';
import { SUBJECT_LABELS } from '../../lib/studentContext';
import { updateProfileAction } from '../_actions/authenticate';

type ProfileFormState = {
  error?: string;
};

type StudentProfile = {
  email: string;
  grade: number | null;
  favoriteSubject: string | null;
  mockExamScore: number | null;
};

const INITIAL_STATE: ProfileFormState = {};

interface ProfileFormProps {
  student: StudentProfile;
}

export default function ProfileForm({ student }: ProfileFormProps) {
  const [state, formAction] = useFormState<ProfileFormState, FormData>(updateProfileAction, INITIAL_STATE);

  return (
    <main className="page profile-page">
      <section className="profile-card">
        <header className="profile-header">
          <div className="profile-header-left">
            <h1>プロフィール設定</h1>
            <p>学年と得意教科を登録すると、学習履歴を正しく記録できます。</p>
            <Link href="/profile/context" className="profile-context-link">
              パーソナライズドドキュメントを編集
            </Link>
          </div>
          <Link href="/student/chat" className="profile-skip">
            チャットへ戻る
          </Link>
        </header>

        <form action={formAction} className="profile-form">
          <div className="profile-fields">
            <label htmlFor="grade">学年 <span className="required">必須</span></label>
            <select id="grade" name="grade" defaultValue={student.grade ? String(student.grade) : ''} required>
              <option value="" disabled>
                選択してください
              </option>
              <option value="1">中学1年生</option>
              <option value="2">中学2年生</option>
              <option value="3">中学3年生</option>
            </select>

            <label htmlFor="favorite-subject">得意教科 <span className="required">必須</span></label>
            <select
              id="favorite-subject"
              name="favoriteSubject"
              defaultValue={student.favoriteSubject ?? ''}
              required
            >
              <option value="" disabled>
                選択してください
              </option>
              {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <label htmlFor="mock-exam-score">模試の点数（任意）</label>
            <input
              id="mock-exam-score"
              name="mockExamScore"
              type="number"
              min="0"
              max="100"
              placeholder="例: 82"
              defaultValue={
                typeof student.mockExamScore === 'number' ? String(student.mockExamScore) : ''
              }
            />
          </div>

          {state?.error ? <p className="profile-error">{state.error}</p> : null}

          <div className="profile-footer">
            <button type="submit">保存してチャットに戻る</button>
          </div>
        </form>
      </section>
    </main>
  );
}
