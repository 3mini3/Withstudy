# 学習履歴データベース設計（PostgreSQL）

中学生向けの学習支援チャットアプリで、学習者の進捗確認を可能にするためのデータベース設計を示します。学習者はメールアドレスで識別し、チャットの全履歴を保持しながら、日次・週次・月次の学習ログを集計できる構造とします。

## 1. エンティティ概要

| エンティティ | 目的 | 主な属性 |
| --- | --- | --- |
| `students` | 学習者の識別とプロフィールを保持 | メールアドレス、学年、得意教科、模試スコア |
| `chat_sessions` | 1 回の学習セッション（タブ＝教科別） | セッションID、教科、開始/終了時刻、メモ |
| `chat_messages` | チャットの各メッセージ（ユーザー / チューター） | メッセージ内容、役割、トークン数 |
| `daily_student_metrics` | 日次×教科ごとの集計値 | 学習日、教科、メッセージ数、セッション数、合計時間 |
| `student_context_documents` | AI へ渡すパーソナライズドコンテキスト | 自己紹介ドキュメント、生成区分 |

今後スコアや質問カテゴリを拡張する際は、`student_subject_scores` や `message_topics` テーブルの追加で対応できます。

## 2. テーブル定義

以下は PostgreSQL 向けの DDL 例です。UUID 利用のため、`uuid-ossp` 拡張を有効にしてください。

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 学習者
CREATE TABLE students (
  email                  TEXT PRIMARY KEY,
  password_hash          TEXT NOT NULL,
  grade                  INTEGER CHECK (grade BETWEEN 1 AND 3),
  favorite_subject       TEXT CHECK (
                              favorite_subject IS NULL OR
                              favorite_subject IN ('math', 'science', 'english', 'social-studies', 'japanese')
                            ),
  mock_exam_score        INTEGER CHECK (mock_exam_score BETWEEN 0 AND 100),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_favorite_subject ON students(favorite_subject);

-- 教科セッション（1 回のチャット開始〜終了）
CREATE TABLE chat_sessions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_email          TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  subject                TEXT NOT NULL CHECK (subject IN ('math', 'science', 'english', 'social-studies', 'japanese')),
  started_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at               TIMESTAMPTZ,
  session_notes          TEXT,
  CONSTRAINT chk_session_time CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX idx_chat_sessions_student_subject ON chat_sessions(student_email, subject);
CREATE INDEX idx_chat_sessions_started_at ON chat_sessions(started_at);

-- メッセージ履歴（プロンプト・回答を完全保存）
CREATE TABLE chat_messages (
  id                     BIGSERIAL PRIMARY KEY,
  session_id             UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role                   TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content                TEXT NOT NULL,
  tokens_estimated       INTEGER,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_time ON chat_messages(session_id, created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);

-- 日次集計（教科別）
CREATE TABLE daily_student_metrics (
  student_email          TEXT NOT NULL REFERENCES students(email) ON DELETE CASCADE,
  subject                TEXT NOT NULL CHECK (subject IN ('math', 'science', 'english', 'social-studies', 'japanese')),
  summary_date           DATE NOT NULL,
  sessions_count         INTEGER NOT NULL DEFAULT 0,
  user_messages_count    INTEGER NOT NULL DEFAULT 0,
  assistant_messages_count INTEGER NOT NULL DEFAULT 0,
  total_token_estimate   INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  last_calculated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_email, subject, summary_date)
);

-- 学習者ごとのパーソナライズドドキュメント
CREATE TABLE student_context_documents (
  student_email          TEXT PRIMARY KEY REFERENCES students(email) ON DELETE CASCADE,
  content                TEXT NOT NULL,
  is_auto_generated      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.1. 更新トリガー

`students.updated_at` を自動更新するトリガー関数を用意すると便利です。

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_updated
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 2.2. 日次集計の算出クエリ例

1 日の終わりに（もしくは定期ジョブで）`daily_student_metrics` を更新する処理例です。

```sql
INSERT INTO daily_student_metrics AS d (
  student_email,
  subject,
  summary_date,
  sessions_count,
  user_messages_count,
  assistant_messages_count,
  total_token_estimate,
  total_duration_seconds,
  last_calculated_at
)
SELECT
  s.student_email,
  s.subject,
  DATE(s.started_at) AS summary_date,
  COUNT(DISTINCT s.id) AS sessions_count,
  COUNT(*) FILTER (WHERE m.role = 'user') AS user_messages_count,
  COUNT(*) FILTER (WHERE m.role = 'assistant') AS assistant_messages_count,
  COALESCE(SUM(m.tokens_estimated), 0) AS total_token_estimate,
  COALESCE(SUM(EXTRACT(EPOCH FROM (s.ended_at - s.started_at))), 0)::INTEGER AS total_duration_seconds,
  NOW()
FROM chat_sessions s
JOIN chat_messages m ON m.session_id = s.id
WHERE s.started_at >= $1 AND s.started_at < $2  -- 期間指定（例: 日付範囲）
GROUP BY s.student_email, s.subject, DATE(s.started_at)
ON CONFLICT (student_email, subject, summary_date)
DO UPDATE SET
  sessions_count = EXCLUDED.sessions_count,
  user_messages_count = EXCLUDED.user_messages_count,
  assistant_messages_count = EXCLUDED.assistant_messages_count,
  total_token_estimate = EXCLUDED.total_token_estimate,
  total_duration_seconds = EXCLUDED.total_duration_seconds,
  last_calculated_at = NOW();
```

## 3. 週次・月次ビュー

日次テーブルがあれば集計ビューで週次・月次の統計が算出できます。

```sql
-- 週次（ISO週）
CREATE OR REPLACE VIEW weekly_student_metrics AS
SELECT
  student_email,
  subject,
  date_trunc('week', summary_date)::DATE AS week_start,
  SUM(sessions_count) AS sessions_count,
  SUM(user_messages_count) AS user_messages_count,
  SUM(assistant_messages_count) AS assistant_messages_count,
  SUM(total_token_estimate) AS total_token_estimate,
  SUM(total_duration_seconds) AS total_duration_seconds
FROM daily_student_metrics
GROUP BY student_email, subject, date_trunc('week', summary_date);

-- 月次
CREATE OR REPLACE VIEW monthly_student_metrics AS
SELECT
  student_email,
  subject,
  date_trunc('month', summary_date)::DATE AS month_start,
  SUM(sessions_count) AS sessions_count,
  SUM(user_messages_count) AS user_messages_count,
  SUM(assistant_messages_count) AS assistant_messages_count,
  SUM(total_token_estimate) AS total_token_estimate,
  SUM(total_duration_seconds) AS total_duration_seconds
FROM daily_student_metrics
GROUP BY student_email, subject, date_trunc('month', summary_date);
```

## 4. アプリケーション実装メモ

- **ログインと学習者登録**: 既存のユーザー名/パスワード認証をメールアドレスベースに変更する際には、`students` テーブルにハッシュ済みパスワードを保存するよう更新してください。
- **チャット記録**: `/api/chat` を呼び出す直前に `chat_sessions` を生成し、レスポンスを受け取ったタイミングで `chat_messages` にユーザー・チューター両方の発話を INSERT します。
- **セッション終了**: フロント側でタブ切り替えやページ離脱時に `ended_at` を更新し、利用時間を算出できるようにします。
- **日次集計バッチ**: cron (例: `node-cron`), サーバーレスのスケジューラー、あるいは Postgres の `pg_cron` を使って毎日集計を回す運用を想定しています。
- **パーソナライズドドキュメント**: 学年・得意教科・模試スコアから自動生成した紹介テキストを `student_context_documents` に保存し、Groq のシステムコンテキストとして利用します。ユーザーが手動編集した場合は `is_auto_generated=false` にすることで自動再生成を抑止できます。

## 5. 将来の拡張ポイント

- **スコア管理**: `student_subject_scores`（学習者 × 教科 × 評価時刻）テーブルで模試以外の評価指標を記録可能。
- **質問カテゴリ**: `message_topics` テーブルと、中間テーブル `chat_message_topics` を追加すれば、複数タグによる分類が可能。
- **分析強化**: OpenAI/Groq の出力ログから難易度推定やメタデータを抽出して格納するために、`chat_messages` に JSONB カラムを追加する余地があります。

---

この設計をベースに Prisma や Drizzle ORM のスキーマを作成すれば、アプリコードから安全に履歴と統計を操作できます。必要に応じてテーブルやビューを調整してください。
