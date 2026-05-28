import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformAdapter } from "./platform-adapter";

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await prisma.vacancy.findUnique({
    where: { id },
    include: { _count: { select: { candidates: true } } },
  });
  if (!v) notFound();

  const block = (label: string, text: string | null) =>
    text ? (
      <div>
        <h3 className="mb-1 text-sm font-semibold text-muted-foreground">{label}</h3>
        <div className="whitespace-pre-line text-sm">{text}</div>
      </div>
    ) : null;

  return (
    <div>
      <PageHeader
        title={v.title}
        description={[v.grade, v.location, v._count.candidates + " кандидатов"]
          .filter(Boolean)
          .join(" · ")}
      />
      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Описание вакансии</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {v.stack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {v.stack.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {(v.salaryMin || v.salaryMax) && (
              <div className="text-sm">
                <span className="text-muted-foreground">Зарплата: </span>
                {v.salaryMin?.toLocaleString()}–{v.salaryMax?.toLocaleString()} тг
              </div>
            )}
            {block("Описание", v.description)}
            {block("Обязанности", v.duties)}
            {block("Требования", v.requirements)}
            {block("Условия", v.conditions)}
          </CardContent>
        </Card>

        <PlatformAdapter
          vacancyId={v.id}
          versions={{
            hh: v.hhVersion,
            linkedin: v.linkedinVersion,
            telegram: v.telegramVersion,
          }}
        />
      </div>
    </div>
  );
}
