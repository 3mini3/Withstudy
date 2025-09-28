# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js routes; `app/login`, `app/register`, and `app/profile` cover auth flows, while `app/_components/` houses shared UI like `ChatDashboard.tsx`.
- `app/api/` exposes backend logic; `chat/route.ts` calls Groq and persists sessions, and `logout/route.ts` clears cookies.
- Reusable helpers live under `lib/` (Prisma client, student context), and database schema plus migrations reside in `prisma/`.
- `docs/` contains architectural notes; update them when workflows, prompts, or data models evolve.

## Build, Test, and Development Commands
- `npm run dev` launches the dev server with hot reload.
- `npm run build` produces a production bundle; run it before review.
- `npm run start` serves the build for production smoke-tests.
- `npm run prisma:migrate` wraps `prisma migrate dev --name <change>`; run after editing `schema.prisma`.
- `npm run prisma:studio` opens Prisma Studio for local data inspection.

## Coding Style & Naming Conventions
- Write all new code in TypeScript (`.ts`/`.tsx`) and convert legacy modules during ongoing work—stay within the typed surface area.
- Use two-space indents, single quotes, and explicit semicolons to mirror existing files.
- Keep components in PascalCase, hooks/utilities in camelCase, and Prisma models singular TitleCase.
- Place `'use client';` directives at the top of client modules; keep server routes free of browser-only APIs.
- Extend shared styles through `app/globals.css`; introduce CSS modules when component-level scoping is needed.

## Testing Guidelines
- No automated suite exists yet; manually exercise registration, login, subject switching, and context editing before merging.
- When adding tests, prefer Jest with React Testing Library, add an `npm test` script, and mirror source paths under `__tests__/`.
- For data flows, use Prisma against a disposable Postgres instance or sqlite proxy, and document setup steps in `docs/`.

## Commit & Pull Request Guidelines
- Keep commits focused and use short imperative descriptions; note schema or UI changes in the body if needed.
- Run `npm run build` and outstanding migrations before pushing; include migration IDs in commit notes.
- PRs should explain intent, list impacted areas, link issues, and attach screenshots or API samples when behavior shifts.
- Call out new environment variables or manual follow-up so reviewers can reproduce the change.

## Configuration & Environment
- Provide `DATABASE_URL` in `.env.local` before running Prisma commands or the dev server.
- Set `GROQ_API_KEY`, with optional `GROQ_MODEL` and `GROQ_SYSTEM_PROMPT`, to enable tutor replies in `app/api/chat/chatbot.ts`.
- Run `npx prisma generate` after schema edits to refresh the client, and avoid logging secrets in server routes or utilities.
