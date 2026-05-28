"use server";

import { prisma } from "@/lib/prisma";
import { evaluateInterview } from "@/lib/ai";
import { revalidatePath } from "next/cache";

export async function startInterview(token: string) {
  const interview = await prisma.interview.findUnique({
    where: { token },
    include: { candidate: { include: { vacancy: true } } },
  });
  if (!interview) throw new Error("Интервью не найдено");
  if (interview.status === "COMPLETED") throw new Error("Интервью уже завершено");
  if (interview.expiresAt < new Date()) throw new Error("Срок интервью истёк");

  if (interview.status === "PENDING") {
    await prisma.interview.update({
      where: { token },
      data: { status: "IN_PROGRESS", startedAt: new Date() },
    });
  }

  return {
    questions: (interview.questions as string[]) ?? [],
    vacancyTitle: interview.candidate.vacancy.title,
    candidateName: interview.candidate.name,
  };
}

export async function submitInterview(
  token: string,
  answers: { question: string; answer: string }[],
) {
  const interview = await prisma.interview.findUnique({
    where: { token },
    include: { candidate: { include: { vacancy: true } } },
  });
  if (!interview) throw new Error("Интервью не найдено");
  if (interview.status === "COMPLETED") throw new Error("Уже завершено");

  const report = await evaluateInterview(
    interview.candidate.vacancy.title,
    answers,
  );

  await prisma.$transaction([
    prisma.interview.update({
      where: { token },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        answers,
        score: report.score,
        strengths: report.strengths,
        risks: report.risks,
        recommendation: report.recommendation,
      },
    }),
    prisma.candidate.update({
      where: { id: interview.candidateId },
      data: { aiScore: report.score },
    }),
  ]);

  revalidatePath("/pipeline");
  return { score: report.score, recommendation: report.recommendation, summary: report.summary };
}
