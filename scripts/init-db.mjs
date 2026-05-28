// Применяет prisma/init.sql через pg (без prisma CLI / движка схемы).
// Идемпотентно: пропускает, если таблица User уже существует.
// pg доступен в standalone (используется @prisma/adapter-pg).
import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
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
