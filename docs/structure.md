# Withstady ウェブアプリ構成概要

最終更新日: 2025年9月28日

## 全体像
- **フレームワーク**: Next.js 14（App Router）＋ TypeScript。
- **目的**: 日本の中学生向けに、5教科のAIチューター体験（Groq API 利用）と学習履歴の記録を提供。
- **主なユーザーフロー**: アカウント登録・ログイン → プロフィール設定 → パーソナライズド文書の編集 → 教科ごとのチャット。

## ディレクトリ構造の要点
### `app/`
- `layout.tsx`: アプリ全体の HTML スケルトンと `<Metadata>` 定義。`app/globals.css` を読み込み。
- `page.tsx`: トップページ。サーバーコンポーネントとしてセッション Cookie を検証し、学生情報を Prisma から取得して `ChatDashboard` を描画。
- `login/page.tsx`, `register/page.tsx`: 認証済みユーザーをリダイレクトし、クライアントフォームを表示。
- `profile/page.tsx`: 認証必須。学生データを取得し、プロフィール編集フォームをレンダリング。
- `profile/context/page.tsx`: 学生のコンテキスト文書を生成／取得してエディターへ渡す。
- `_components/`: すべてクライアントコンポーネント。チャット画面、認証フォーム、プロフィールフォーム、文書エディターなど。
- `_actions/`: サーバーアクション。登録・ログイン・プロフィール更新・文書保存＆再生成のビジネスロジック。

### `app/api/`
- `chat/route.ts`: JSON ペイロードの検証、`ChatSession`/`ChatMessage` の永続化、`DailyStudentMetric` の更新、Groq への問い合わせを担当。
- `chat/chatbot.ts`: Groq SDK ラッパー。基底システムプロンプトと教科コンテキスト・履歴を結合し、型安全に応答を取得。
- `logout/route.ts`: `withstady-session` Cookie を削除してログアウト処理を完了。

### `lib/`
- `prisma.ts`: PrismaClient を単一インスタンス化し、開発環境では `globalThis` にキャッシュ。
- `studentContext.ts`: 教科ラベル型 (`SubjectId`) の定義、パーソナライズド文書の自動生成、手動文書とのマージ、文書生成ロジックを提供。

### `app/globals.css`
- ページ全体の背景、カードレイアウト、タブ、チャット UI、レスポンシブ調整などを定義。
- `ChatDashboard` のクラス名（例: `.tab-button`, `.chat-history`, `.chat-form`）と同期しているため、UI変更時は双方を同時に更新する。

### `prisma/schema.prisma`
- **Student**: 認証・プロフィール情報とコンテキスト文書へのリレーションを保持。
- **ChatSession**: 学生 × 教科 × 日付でチャットをグルーピング。
- **ChatMessage**: 各発話（role, content, token 推定値）。
- **DailyStudentMetric**: 日次集計（セッション数、メッセージ数、推定トークン、経過時間）。
- **StudentContextDocument**: 自動生成と手動編集を混在させた指示文書。

## セッション／認証
- セッション Cookie 名は `withstady-session`。`authenticate.ts` 内で登録・ログイン時に `{ email }` を直列化して保存。
- 各サーバーコンポーネント／アクションが Cookie を解析し、未ログイン時は `/login` へリダイレクト。
- パスワードは `bcryptjs` でハッシュ化。登録処理では重複メールや最小文字数をバリデーション。

## パーソナライズドコンテキストの流れ
1. プロフィールで学年・得意教科・模試スコアを登録。
2. `ensureStudentContextDocument` が自動セクションを生成し、手動編集部分とマージ。
3. `/profile/context` で手動編集や再生成が可能。手動編集済みの場合は自動セクションのみ更新。
4. チャット API は個別コンテキストと教科別プロンプトを結合して Groq へ送信。

## チャットと学習履歴
1. `ChatDashboard` が教科タブごとのチャット履歴を管理し、`/api/chat` に POST。
2. ルートでユーザー発話を `ChatMessage` として保存し、必要に応じて `ChatSession` を生成。
3. Groq 応答後にアシスタント発話を保存し、セッション終了時刻と `DailyStudentMetric` を更新。
4. 集計データはダッシュボードや後続分析のために利用可能。

## 環境変数とコマンド
- 必須: `DATABASE_URL`, `GROQ_API_KEY`。
- 任意: `GROQ_MODEL`, `GROQ_SYSTEM_PROMPT`。
- 開発コマンド: `npm run dev`（tsconfig/next-env 自動生成済み）、`npm run build`、`npm run start`。
- Prisma: `npm run prisma:migrate`, `npm run prisma:studio`, `npx prisma generate`。

## テストと品質確認
- 自動テスト未整備。手動で以下を確認すること:
  - 登録／ログイン／ログアウトフロー
  - プロフィール編集・得意教科切り替え
  - 文書編集と再生成
  - 各教科でのチャット往復
- 将来は Jest + React Testing Library を `app/` に対応するフォルダ構成で導入検討。

## TypeScript 運用ルール
- `.ts`/`.tsx` 化済み。新規コードも TypeScript で記述する。
- サーバーアクションの戻り値、API ペイロード、Groq 履歴などは型定義を共有し、`SubjectId` などのユニオン型は `lib/` から再利用する。

## 今後の改善候補
- `DailyStudentMetric` を可視化する進捗ダッシュボード。
- Groq レスポンスのストリーミングと楽観的 UI 更新。
- 文言の i18n 対応（英語／日本語以外への拡張）。
- CI 上での自動テスト／Lint／型チェック整備。

以上が現在のウェブサイト設計および実装詳細のサマリです。システム変更時は本資料と `docs/` 以下の関連ドキュメントを更新してください。
