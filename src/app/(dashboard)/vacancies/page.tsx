import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function VacanciesPage() {
  const vacancies = await prisma.vacancy.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { candidates: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Вакансии"
        description="Генерация и управление вакансиями"
        action={
          <Link href="/vacancies/new" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> Создать вакансию
          </Link>
        }
      />
      <div className="space-y-3 p-8">
        {vacancies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Вакансий пока нет. Создайте первую с помощью AI.
          </p>
        ) : (
          vacancies.map((v) => (
            <Link key={v.id} href={`/vacancies/${v.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-medium">{v.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {[v.grade, v.location].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.stack.slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                    <Badge>{v._count.candidates} канд.</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
