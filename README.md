# Withstady Tutor

A simple Next.js web app that lets students ask homework questions to an AI tutor powered by Groq while keeping the full chat history visible.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and add your Groq API key and PostgreSQL connection string:
   ```bash
   cp .env.local.example .env.local
   # edit .env.local and set GROQ_API_KEY=your_key_here
   # edit .env.local and set DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/withstady
   ```
3. Run Prisma migrations to create the tables:
   ```bash
   npx prisma migrate dev --name init
   ```
4. (Optional) Override model behaviour by setting `GROQ_MODEL` or `GROQ_SYSTEM_PROMPT` in `.env.local`.

5. Generate the Prisma client (automatically done by the migrate command, but safe to repeat):
   ```bash
   npx prisma generate
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```
7. Open [http://localhost:3000](http://localhost:3000) to use the tutor. 新規登録からメールアドレスとパスワードを作成し、ログイン後にプロフィール（学年・得意教科）を入力するとチャットが利用可能になります。

## Scripts

- `npm run dev` – start the development server
- `npm run build` – create a production build
- `npm run start` – run the production server

## Notes

- 5人のチューター（数学 / 理科 / 英語 / 社会 / 国語）をタブで切り替えられます。各チューターには専用コンテキストが設定され、教科に合わせた回答を行います。
- The Groq API is called from a server-side route (`/api/chat`) that enriches each request with the selected subject context before passing it to Groq via the official SDK.
- Subject chat history is maintained independently on the client, soタブを切り替えても会話がそのまま残ります。
- Authentication handles registration/login with hashed passwords stored in PostgreSQL, and未入力のプロフィールがある場合は自動的に設定画面へリダイレクトします。
- 生徒ごとのパーソナライズド文書を PostgreSQL (`student_context_documents`) に保存し、チャット時のコンテキストとして Groq に渡します。
- Update the UI or styling in `app/_components/ChatDashboard.jsx` and `app/globals.css`.
