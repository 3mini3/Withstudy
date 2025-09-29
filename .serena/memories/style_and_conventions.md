# Style and Conventions
- Write new code in TypeScript with two-space indent, single quotes, explicit semicolons; follow existing PascalCase for components, camelCase for hooks/utilities, singular TitleCase Prisma models.
- Place `'use client';` at the top of client components; keep server routes/actions free of browser-only APIs.
- Reuse shared styles via `app/globals.css`; create CSS modules only when component-scoped styling is required.
- Share domain types from `lib/` (e.g., `SubjectId`, student context helpers); keep server/actions typed for payloads and return values.
- Update `docs/` when workflows, prompts, or schema changes occur; keep comments succinct and only where non-obvious logic needs clarification.