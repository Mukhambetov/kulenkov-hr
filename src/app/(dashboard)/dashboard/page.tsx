import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Clock, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  const [vacancies, candidates, inProgress, hired] = await Promise.all([
    prisma.vacancy.count({ where: { isActive: true } }),
    prisma.candidate.count(),
    prisma.candidate.count({
      where: { status: { in: ["SCREENING", "AI_INTERVIEW", "TECH_INTERVIEW", "OFFER"] } },
    }),
    prisma.candidate.count({ where: { status: "HIRED" } }),
  ]);

  const stats = [
    { label: "Активных вакансий", value: vacancies, icon: FileText },
    { label: "Всего кандидатов", value: candidates, icon: Users },
    { label: "В работе", value: inProgress, icon: Clock },
    { label: "Нанято", value: hired, icon: CheckCircle2 },
  ];

  return (
    <div>
      <PageHeader title="Дашборд" description="Обзор найма" />
      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
