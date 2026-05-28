"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VacancyPicker({
  vacancies,
  selected,
}: {
  vacancies: { id: string; title: string }[];
  selected?: string;
}) {
  const router = useRouter();
  if (vacancies.length === 0) return null;

  return (
    <Select
      value={selected}
      onValueChange={(v) => router.push(`/pipeline?vacancy=${v}`)}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Выберите вакансию" />
      </SelectTrigger>
      <SelectContent>
        {vacancies.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
