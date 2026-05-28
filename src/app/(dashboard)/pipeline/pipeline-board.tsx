"use client";

import { useState, useTransition } from "react";
import { PIPELINE_STAGES, isSlaBreached } from "@/lib/pipeline";
import { addCandidate, moveCandidate, createInterview } from "./actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Plus, ChevronRight, Bot } from "lucide-react";
import { toast } from "sonner";
import type { CandidateStatus } from "@/generated/prisma/enums";

interface Candidate {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: CandidateStatus;
  aiScore: number | null;
  stageEnteredAt: string;
  hasInterview: boolean;
}

export function PipelineBoard({
  vacancyId,
  candidates,
}: {
  vacancyId: string;
  candidates: Candidate[];
}) {
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast.error("Укажите имя");
      return;
    }
    startTransition(async () => {
      await addCandidate({ vacancyId, ...form });
      setForm({ name: "", email: "", phone: "" });
      setAdding(false);
      toast.success("Кандидат добавлен");
    });
  };

  const handleMove = (id: string, to: CandidateStatus) => {
    startTransition(async () => {
      await moveCandidate(id, to);
      toast.success("Кандидат перемещён");
    });
  };

  const handleCreateInterview = (id: string) => {
    startTransition(async () => {
      const { token } = await createInterview(id);
      const link = `${window.location.origin}/interview/${token}`;
      await navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Интервью создано. Ссылка скопирована", {
        description: link,
      });
    });
  };

  const nextStage = (status: CandidateStatus): CandidateStatus | null => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.status === status);
    return idx >= 0 && idx < PIPELINE_STAGES.length - 1
      ? PIPELINE_STAGES[idx + 1].status
      : null;
  };

  return (
    <div className="flex flex-1 gap-3 overflow-x-auto p-6">
      {PIPELINE_STAGES.map((stage) => {
        const items = candidates.filter((c) => c.status === stage.status);
        return (
          <div key={stage.status} className="flex w-72 flex-shrink-0 flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-medium">{stage.label}</span>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            <div className="flex-1 space-y-2 rounded-lg bg-muted/30 p-2">
              {stage.status === "APPLIED" && (
                <>
                  {adding ? (
                    <Card className="space-y-2 p-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Имя</Label>
                        <Input
                          className="h-8"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          className="h-8"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAdd} disabled={pending}>
                          Добавить
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                          Отмена
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => setAdding(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Добавить
                    </Button>
                  )}
                </>
              )}
              {items.map((c) => {
                const breached = isSlaBreached(c.status, new Date(c.stageEnteredAt));
                const next = nextStage(c.status);
                return (
                  <Card key={c.id} className="space-y-2 p-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">{c.name}</span>
                      {breached && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {c.email && (
                      <div className="truncate text-xs text-muted-foreground">
                        {c.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {c.aiScore != null && (
                        <Badge variant="secondary" className="gap-1">
                          <Bot className="h-3 w-3" /> {c.aiScore.toFixed(1)}
                        </Badge>
                      )}
                      {c.hasInterview && (
                        <Badge variant="outline" className="text-xs">
                          интервью
                        </Badge>
                      )}
                    </div>
                    {c.status === "SCREENING" && !c.hasInterview && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        disabled={pending}
                        onClick={() => handleCreateInterview(c.id)}
                      >
                        <Bot className="mr-1 h-3 w-3" /> Создать AI-интервью
                      </Button>
                    )}
                    {next && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={pending}
                        onClick={() => handleMove(c.id, next)}
                      >
                        {PIPELINE_STAGES.find((s) => s.status === next)?.label}
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
