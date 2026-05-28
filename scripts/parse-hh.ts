/**
 * Парсер вакансий hh.kz через публичное API (api.hh.ru).
 * Запуск: pnpm parse
 * Собирает вакансии по популярным IT-должностям в Казахстане.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const QUERIES = [
  "Frontend Developer",
  "Backend Developer",
  "Go Developer",
  "Python Developer",
  "DevOps",
  "QA Engineer",
  "Project Manager",
  "Data Analyst",
];

// Казахстан = area 40 в hh.ru
const KZ_AREA = "40";

interface HHItem {
  name: string;
  area: { name: string };
  employer: { name: string };
  salary: { from: number | null; to: number | null; currency: string } | null;
  snippet: { requirement: string | null };
}

async function fetchVacancies(query: string): Promise<HHItem[]> {
  const url = `https://api.hh.ru/vacancies?text=${encodeURIComponent(
    query,
  )}&area=${KZ_AREA}&per_page=50&only_with_salary=true`;
  const res = await fetch(url, {
    headers: { "User-Agent": "kulenkov-hr-analytics/1.0" },
  });
  if (!res.ok) {
    console.error(`hh.ru ${query}: ${res.status}`);
    return [];
  }
  const data = (await res.json()) as { items: HHItem[] };
  return data.items ?? [];
}

// KZT-нормализация (грубо; hh может вернуть KZT/RUR/USD)
const RATE: Record<string, number> = { KZT: 1, RUR: 5.2, USD: 480, EUR: 520 };

async function main() {
  console.log("Парсинг hh.kz...");
  let total = 0;

  for (const query of QUERIES) {
    const items = await fetchVacancies(query);
    for (const item of items) {
      if (!item.salary) continue;
      const rate = RATE[item.salary.currency] ?? 1;
      const salaryMin = item.salary.from ? Math.round(item.salary.from * rate) : null;
      const salaryMax = item.salary.to ? Math.round(item.salary.to * rate) : null;
      if (!salaryMin && !salaryMax) continue;

      await prisma.salaryDataPoint.create({
        data: {
          title: query,
          salaryMin,
          salaryMax,
          location: item.area.name,
          company: item.employer.name,
          source: "hh.kz",
          skills: [],
        },
      });
      total++;
    }
    console.log(`${query}: ${items.length} вакансий`);
    await new Promise((r) => setTimeout(r, 500)); // rate limit
  }

  console.log(`Готово. Сохранено ${total} точек данных.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
