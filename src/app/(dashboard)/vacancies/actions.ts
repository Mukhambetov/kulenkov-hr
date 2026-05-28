"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVacancy, adaptVacancy, type GeneratedVacancy } from "@/lib/ai";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function generateVacancyDraft(input: {
  title: string;
  department?: string;
  grade?: string;
  stack?: string;
  location?: string;
  salaryMin?: string;
  salaryMax?: string;
}): Promise<GeneratedVacancy> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return generateVacancy({
    title: input.title,
    department: input.department || undefined,
    grade: input.grade || undefined,
    stack: input.stack ? input.stack.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    location: input.location || undefined,
    salaryMin: input.salaryMin ? Number(input.salaryMin) : undefined,
    salaryMax: input.salaryMax ? Number(input.salaryMax) : undefined,
  });
}

export async function saveVacancy(input: {
  title: string;
  department?: string;
  grade?: string;
  stack?: string;
  location?: string;
  salaryMin?: string;
  salaryMax?: string;
  description: string;
  duties: string;
  requirements: string;
  conditions: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const vacancy = await prisma.vacancy.create({
    data: {
      title: input.title,
      department: input.department || null,
      grade: input.grade || null,
      stack: input.stack ? input.stack.split(",").map((s) => s.trim()).filter(Boolean) : [],
      location: input.location || null,
      salaryMin: input.salaryMin ? Number(input.salaryMin) : null,
      salaryMax: input.salaryMax ? Number(input.salaryMax) : null,
      description: input.description,
      duties: input.duties,
      requirements: input.requirements,
      conditions: input.conditions,
      createdById: session.user.id,
    },
  });

  revalidatePath("/vacancies");
  redirect(`/vacancies/${vacancy.id}`);
}

export async function adaptVacancyForPlatform(
  vacancyId: string,
  platform: "hh" | "linkedin" | "telegram",
) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const v = await prisma.vacancy.findUnique({ where: { id: vacancyId } });
  if (!v) throw new Error("Not found");

  const text = await adaptVacancy(
    {
      title: v.title,
      description: v.description ?? "",
      duties: v.duties ? v.duties.split("\n").filter(Boolean) : [],
      requirements: v.requirements ? v.requirements.split("\n").filter(Boolean) : [],
      conditions: v.conditions ? v.conditions.split("\n").filter(Boolean) : [],
    },
    platform,
  );

  const field =
    platform === "hh" ? "hhVersion" : platform === "linkedin" ? "linkedinVersion" : "telegramVersion";

  await prisma.vacancy.update({
    where: { id: vacancyId },
    data: { [field]: text },
  });

  revalidatePath(`/vacancies/${vacancyId}`);
  return text;
}
