import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalaryChart } from "./salary-chart";

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

export default async function AnalyticsPage() {
  const data = await prisma.salaryDataPoint.findMany();

  // Группировка по должности
  const byTitle = new Map<string, number[]>();
  for (const d of data) {
    const avg =
      d.salaryMin && d.salaryMax
        ? (d.salaryMin + d.salaryMax) / 2
        : (d.salaryMin ?? d.salaryMax ?? 0);
    if (avg > 0) {
      if (!byTitle.has(d.title)) byTitle.set(d.title, []);
      byTitle.get(d.title)!.push(avg);
    }
  }

  const rows = [...byTitle.entries()]
    .map(([title, salaries]) => ({
      title,
      count: salaries.length,
      median: Math.round(median(salaries)),
      p25: Math.round(percentile(salaries, 25)),
      p75: Math.round(percentile(salaries, 75)),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title="Аналитика рынка труда"
        description={`Данные по ${data.length} вакансиям из открытых источников (hh.kz, enbek.kz)`}
      />
      <div className="space-y-6 p-8">
        {data.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Данных пока нет. Запустите парсер: <code>pnpm parse</code>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Медианные зарплаты по должностям (тенге)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SalaryChart data={rows.slice(0, 10)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Зарплатные вилки</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 font-medium">Должность</th>
                        <th className="py-2 text-right font-medium">Вакансий</th>
                        <th className="py-2 text-right font-medium">25%</th>
                        <th className="py-2 text-right font-medium">Медиана</th>
                        <th className="py-2 text-right font-medium">75%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.title} className="border-b last:border-0">
                          <td className="py-2">{r.title}</td>
                          <td className="py-2 text-right">{r.count}</td>
                          <td className="py-2 text-right text-muted-foreground">
                            {r.p25.toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-medium">
                            {r.median.toLocaleString()}
                          </td>
                          <td className="py-2 text-right text-muted-foreground">
                            {r.p75.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
