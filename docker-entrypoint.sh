#!/bin/sh
set -e

echo "Применение схемы БД (prisma db push)..."
DATABASE_URL="$DATABASE_URL" node_modules/.bin/prisma db push --skip-generate --accept-data-loss

echo "Запуск сервера (админ создаётся через instrumentation)..."
exec node server.js
