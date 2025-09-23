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
3. (Optional) Override defaults by setting `GROQ_MODEL` or `GROQ_SYSTEM_PROMPT` in `.env.local`.

4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) to use the tutor.

## Scripts

- `npm run dev` – start the development server
- `npm run build` – create a production build
- `npm run start` – run the production server

## Notes

- The Groq API is called from a server-side route (`/api/chat`).
- Chat history is held on the client side so the conversation stays visible while you continue asking questions.
- Update the UI or styling in `app/page.js` and `app/globals.css`.
