# Kulenkov HR AI Platform

Единая платформа автоматизации найма с 4 AI-модулями:

1. **AI-генерация вакансий** — описание, требования, адаптация под hh.kz / LinkedIn / Telegram
2. **ATS — воронка найма** — Kanban-доска кандидатов, SLA-таймеры, AI-ранжирование
3. **AI-интервьюер** — автоматическое первичное интервью (чат), оценка кандидата
4. **HR Analytics** — парсинг рынка труда (hh.kz), зарплатные вилки, дашборды

## Стек

- Next.js 16 (App Router) + TypeScript
- Prisma 7 + PostgreSQL 16 (driver adapter `@prisma/adapter-pg`)
- Auth.js v5 (JWT, credentials)
- Vercel AI SDK + Anthropic Claude
- Tailwind + shadcn/ui + Recharts

## Локальная разработка

```bash
pnpm install
# Поднять Postgres локально, прописать DATABASE_URL в .env
pnpm db:push      # применить схему
pnpm seed         # создать админа admin@kulenkov.kz / admin123
pnpm parse        # (опц.) спарсить вакансии с hh.kz для аналитики
pnpm dev
```

Нужен `ANTHROPIC_API_KEY` в `.env` для AI-функций.

## Деплой

Docker standalone. `docker-compose.yml` поднимает Postgres + app.
При старте контейнера: `prisma db push` применяет схему, админ создаётся через `instrumentation.ts`.

Env: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `ANTHROPIC_API_KEY`.
