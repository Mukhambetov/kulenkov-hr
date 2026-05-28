import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PipelineBoard } from "./pipeline-board";
import { VacancyPicker } from "./vacancy-picker";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ vacancy?: string }>;
}) {
  const { vacancy: vacancyId } = await searchParams;

  const vacancies = await prisma.vacancy.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const selected = vacancyId ?? vacancies[0]?.id;

  const candidates = selected
    ? await prisma.candidate.findMany({
        where: { vacancyId: selected },
        orderBy: [{ aiScore: "desc" }, { createdAt: "asc" }],
        include: { interviews: { select: { status: true, score: true } } },
      })
    : [];

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Воронка найма"
        description="ATS — управление кандидатами по этапам"
        action={<VacancyPicker vacancies={vacancies} selected={selected} />}
      />
      {selected ? (
        <PipelineBoard
          vacancyId={selected}
          candidates={candidates.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            status: c.status,
            aiScore: c.aiScore,
            stageEnteredAt: c.stageEnteredAt.toISOString(),
            hasInterview: c.interviews.length > 0,
          }))}
        />
      ) : (
        <div className="p-8 text-sm text-muted-foreground">
          Сначала создайте вакансию.
        </div>
      )}
    </div>
  );
}
