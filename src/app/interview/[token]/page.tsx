import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InterviewModes } from "./interview-modes";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const interview = await prisma.interview.findUnique({
    where: { token },
    include: { candidate: { include: { vacancy: true } } },
  });

  if (!interview) notFound();

  const expired = interview.expiresAt < new Date();
  const completed = interview.status === "COMPLETED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold">
            Интервью: {interview.candidate.vacancy.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Здравствуйте, {interview.candidate.name}!
          </p>
        </div>
        {completed ? (
          <div className="rounded-lg border bg-background p-8 text-center">
            <p className="font-medium">Интервью завершено</p>
            <p className="text-sm text-muted-foreground">
              Спасибо! HR-команда свяжется с вами.
            </p>
          </div>
        ) : expired ? (
          <div className="rounded-lg border bg-background p-8 text-center">
            <p className="font-medium">Срок интервью истёк</p>
          </div>
        ) : (
          <InterviewModes
            token={token}
            questions={(interview.questions as string[]) ?? []}
          />
        )}
      </div>
    </div>
  );
}
