"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInterviewQuestions } from "@/lib/ai";
import { revalidatePath } from "next/cache";
import type { CandidateStatus } from "@/generated/prisma/enums";

export async function createInterview(candidateId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { vacancy: true },
  });
  if (!candidate) throw new Error("Not found");

  const questions = await generateInterviewQuestions({
    title: candidate.vacancy.title,
    requirements: candidate.vacancy.requirements,
    stack: candidate.vacancy.stack,
  });

  const expiresAt = new Date(Date.now() + 72 * 3_600_000);

  const interview = await prisma.interview.create({
    data: {
      candidateId,
      questions,
      expiresAt,
    },
  });

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "AI_INTERVIEW", stageEnteredAt: new Date() },
  });

  revalidatePath("/pipeline");
  return { token: interview.token };
}

export async function addCandidate(input: {
  vacancyId: string;
  name: string;
  email?: string;
  phone?: string;
  telegram?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await prisma.candidate.create({
    data: {
      vacancyId: input.vacancyId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      telegram: input.telegram || null,
      addedById: session.user.id,
      history: { create: { toStatus: "APPLIED" } },
    },
  });

  revalidatePath("/pipeline");
}

export async function moveCandidate(
  candidateId: string,
  toStatus: CandidateStatus,
  comment?: string,
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) throw new Error("Not found");

  await prisma.$transaction([
    prisma.candidate.update({
      where: { id: candidateId },
      data: { status: toStatus, stageEnteredAt: new Date() },
    }),
    prisma.candidateHistory.create({
      data: {
        candidateId,
        fromStatus: candidate.status,
        toStatus,
        comment: comment || null,
      },
    }),
  ]);

  revalidatePath("/pipeline");
}
