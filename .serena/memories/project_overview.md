# Project Overview
- Withstady Tutor is a Next.js 14 (App Router) + TypeScript web app delivering subject-specific AI tutoring via Groq for Japanese middle school students.
- Core flow: user registers and logs in, completes profile, edits personalized study context, then chats across five subject tabs (math, science, English, social studies, Japanese).
- Data persisted with Prisma/PostgreSQL covering students, sessions, messages, personalized context documents, and daily metrics.
- App directory drives UI/Server Components; shared client UI in `app/_components`, auth/profile routes under `app/login`, `app/register`, `app/profile`, server logic via `app/api` and `app/_actions`.
- Docs under `docs/` capture architecture, structure, database design, and TODOs; keep them updated when workflows or models change.