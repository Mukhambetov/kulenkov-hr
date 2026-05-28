// Применяет prisma/init.sql через pg (без prisma CLI / движка схемы).
// Идемпотентно: пропускает, если таблица User уже существует.
// С retry — свежий postgres-том инициализируется не мгновенно.
import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

async function connectWithRetry(attempts = 10, delayMs = 3000) {
  for (let i = 1; i <= attempts; i++) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      return client;
    } catch (e) {
      await client.end().catch(() => {});
      console.log(`[init-db] Подключение ${i}/${attempts} не удалось: ${e.message}`);
      if (i === attempts) throw e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const client = await connectWithRetry();
  try {
    const { rows } = await client.query(
      `SELECT to_regclass('public."User"') AS exists`,
    );
    if (rows[0].exists) {
      console.log("[init-db] Схема уже применена, пропускаю.");
      return;
    }
    const sql = readFileSync(new URL("../prisma/init.sql", import.meta.url), "utf8");
    await client.query(sql);
    console.log("[init-db] Схема применена.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[init-db] Ошибка:", e.message);
  process.exit(1);
});
