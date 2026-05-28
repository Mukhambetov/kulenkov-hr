"use client";

import { useState, useTransition } from "react";
import { submitInterview } from "../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2 } from "lucide-react";

export function InterviewChat({
  token,
  questions,
}: {
  token: string;
  questions: string[];
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    new Array(questions.length).fill(""),
  );
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const isLast = current === questions.length - 1;

  const handleNext = () => {
    if (!answers[current].trim()) return;
    if (isLast) {
      startTransition(async () => {
        await submitInterview(
          token,
          questions.map((q, i) => ({ question: q, answer: answers[i] })),
        );
        setDone(true);
      });
    } else {
      setCurrent((c) => c + 1);
    }
  };

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <p className="font-medium">Спасибо за интервью!</p>
          <p className="text-sm text-muted-foreground">
            Ваши ответы отправлены HR-команде.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="text-xs text-muted-foreground">
          Вопрос {current + 1} из {questions.length}
        </div>
        <div className="flex gap-3 rounded-lg bg-muted/50 p-4">
          <Bot className="h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-sm">{questions[current]}</p>
        </div>
        <Textarea
          rows={6}
          placeholder="Ваш ответ..."
          value={answers[current]}
          onChange={(e) => {
            const next = [...answers];
            next[current] = e.target.value;
            setAnswers(next);
          }}
        />
        <Button
          onClick={handleNext}
          disabled={pending || !answers[current].trim()}
          className="w-full"
        >
          {pending
            ? "Отправка..."
            : isLast
              ? "Завершить интервью"
              : "Следующий вопрос"}
        </Button>
      </CardContent>
    </Card>
  );
}
