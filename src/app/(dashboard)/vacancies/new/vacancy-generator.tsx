"use client";

import { useState, useTransition } from "react";
import { generateVacancyDraft, saveVacancy } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Save } from "lucide-react";
import { toast } from "sonner";

interface Params {
  title: string;
  department: string;
  grade: string;
  stack: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
}

export function VacancyGenerator() {
  const [params, setParams] = useState<Params>({
    title: "",
    department: "",
    grade: "",
    stack: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
  });
  const [draft, setDraft] = useState({
    description: "",
    duties: "",
    requirements: "",
    conditions: "",
  });
  const [generating, startGenerate] = useTransition();
  const [saving, startSave] = useTransition();

  const set = (k: keyof Params) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setParams((p) => ({ ...p, [k]: e.target.value }));

  const handleGenerate = () => {
    if (!params.title.trim()) {
      toast.error("Укажите должность");
      return;
    }
    startGenerate(async () => {
      try {
        const result = await generateVacancyDraft(params);
        setDraft({
          description: result.description,
          duties: result.duties.join("\n"),
          requirements: result.requirements.join("\n"),
          conditions: result.conditions.join("\n"),
        });
        toast.success("Вакансия сгенерирована");
      } catch {
        toast.error("Ошибка генерации. Проверьте API-ключ.");
      }
    });
  };

  const handleSave = () => {
    startSave(async () => {
      try {
        await saveVacancy({ ...params, ...draft });
      } catch {
        toast.error("Ошибка сохранения");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Параметры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Должность *</Label>
            <Input
              value={params.title}
              onChange={set("title")}
              placeholder="Senior Go Developer"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Грейд</Label>
              <Input value={params.grade} onChange={set("grade")} placeholder="Senior" />
            </div>
            <div className="space-y-2">
              <Label>Отдел</Label>
              <Input value={params.department} onChange={set("department")} placeholder="Backend" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Стек (через запятую)</Label>
            <Input value={params.stack} onChange={set("stack")} placeholder="Go, PostgreSQL, Docker" />
          </div>
          <div className="space-y-2">
            <Label>Локация</Label>
            <Input value={params.location} onChange={set("location")} placeholder="Алматы" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Зарплата от</Label>
              <Input value={params.salaryMin} onChange={set("salaryMin")} placeholder="800000" />
            </div>
            <div className="space-y-2">
              <Label>Зарплата до</Label>
              <Input value={params.salaryMax} onChange={set("salaryMax")} placeholder="1200000" />
            </div>
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? "Генерация..." : "Сгенерировать AI"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Результат</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Обязанности (по строкам)</Label>
            <Textarea
              rows={4}
              value={draft.duties}
              onChange={(e) => setDraft((d) => ({ ...d, duties: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Требования (по строкам)</Label>
            <Textarea
              rows={4}
              value={draft.requirements}
              onChange={(e) => setDraft((d) => ({ ...d, requirements: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Условия (по строкам)</Label>
            <Textarea
              rows={3}
              value={draft.conditions}
              onChange={(e) => setDraft((d) => ({ ...d, conditions: e.target.value }))}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !draft.description}
            variant="default"
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Сохранение..." : "Сохранить вакансию"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
