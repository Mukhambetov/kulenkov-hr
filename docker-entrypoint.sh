#!/bin/sh
set -e

echo "Применение схемы БД (init-db.mjs через pg)..."
node scripts/init-db.mjs

echo "Запуск сервера (админ создаётся через instrumentation)..."
exec node server.js
