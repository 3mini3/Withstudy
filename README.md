# Withstady Tutor

A simple Next.js web app that lets students ask homework questions to an AI tutor powered by Groq while keeping the full chat history visible.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and add your Groq API key:
   ```bash
   cp .env.local.example .env.local
   # edit .env.local and set GROQ_API_KEY=your_key_here
   ```
3. (Optional) set `AUTH_USERNAME` / `AUTH_PASSWORD` to control login credentials (defaults: `student` / `study123`).
4. (Optional) Override model behaviour by setting `GROQ_MODEL` or `GROQ_SYSTEM_PROMPT` in `.env.local`.

5. Run the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) to use the tutor. ログインページが表示されたら、設定したユーザー名とパスワードでサインインしてください。

## Scripts

- `npm run dev` – start the development server
- `npm run build` – create a production build
- `npm run start` – run the production server

## Notes

- 5人のチューター（数学 / 理科 / 英語 / 社会 / 国語）をタブで切り替えられます。各チューターには専用コンテキストが設定され、教科に合わせた回答を行います。
- The Groq API is called from a server-side route (`/api/chat`) that enriches each request with the selected subject context before passing it to Groq via the official SDK.
- Subject chat history is maintained independently on the client, soタブを切り替えても会話がそのまま残ります。
- Authentication is handled via a simple form that validates against environment-based credentials and stores a short-lived cookie session.
- Update the UI or styling in `app/_components/ChatDashboard.jsx` and `app/globals.css`.
