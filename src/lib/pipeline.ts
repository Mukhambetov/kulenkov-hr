import type { CandidateStatus } from "@/generated/prisma/enums";

export const PIPELINE_STAGES: {
  status: CandidateStatus;
  label: string;
  slaHours: number;
}[] = [
  { status: "APPLIED", label: "Отклик", slaHours: 48 },
  { status: "SCREENING", label: "Скрининг", slaHours: 72 },
  { status: "AI_INTERVIEW", label: "AI-интервью", slaHours: 72 },
  { status: "TECH_INTERVIEW", label: "Тех. интервью", slaHours: 120 },
  { status: "OFFER", label: "Оффер", slaHours: 120 },
  { status: "HIRED", label: "Нанят", slaHours: 0 },
];

export const STATUS_LABEL: Record<CandidateStatus, string> = {
  APPLIED: "Отклик",
  SCREENING: "Скрининг",
  AI_INTERVIEW: "AI-интервью",
  TECH_INTERVIEW: "Тех. интервью",
  OFFER: "Оффер",
  HIRED: "Нанят",
  REJECTED: "Отказ",
};

export function isSlaBreached(
  status: CandidateStatus,
  stageEnteredAt: Date,
): boolean {
  const stage = PIPELINE_STAGES.find((s) => s.status === status);
  if (!stage || stage.slaHours === 0) return false;
  const hours = (Date.now() - stageEnteredAt.getTime()) / 3_600_000;
  return hours > stage.slaHours;
}
