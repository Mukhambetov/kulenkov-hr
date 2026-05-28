# ---- deps ----
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@8.9.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

# ---- builder ----
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8.9.0 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL чтобы сборка не падала на инстанцировании prisma
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma client генерируется, затем сборка Next standalone
RUN pnpm prisma generate
RUN pnpm exec next build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone сборка + статика + публичные файлы
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Схема SQL + скрипт инициализации БД (через pg, без prisma CLI)
COPY --from=builder /app/prisma/init.sql ./prisma/init.sql
COPY --from=builder /app/scripts/init-db.mjs ./scripts/init-db.mjs

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
