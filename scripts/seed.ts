import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@kulenkov.kz" },
    update: {},
    create: {
      email: "admin@kulenkov.kz",
      name: "Администратор",
      password,
      role: "ADMIN",
    },
  });
  console.log("Seed готов. Логин: admin@kulenkov.kz / admin123");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
