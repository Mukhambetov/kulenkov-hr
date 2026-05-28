import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Минтит эфемерный client secret для OpenAI Realtime API (WebRTC).
// Модель настроена как HR-интервьюер на русском. Демо ограничено 26 секундами.
export async function POST(req: NextRequest) {
  const { token } = await req.json();

  const interview = await prisma.interview.findUnique({
    where: { token },
    include: { candidate: { include: { vacancy: true } } },
  });
  if (!interview) {
    return NextResponse.json({ error: "Интервью не найдено" }, { status: 404 });
  }

  const questions = (interview.questions as string[]) ?? [];
  const vacancy = interview.candidate.vacancy;

  const instructions = `Ты — AI-интервьюер казахстанской IT-компании. Проводишь короткое голосовое первичное интервью на позицию "${vacancy.title}" на русском языке.

Кандидат: ${interview.candidate.name}.
Темы для вопросов: ${questions.slice(0, 3).join("; ")}

Правила:
- Говори дружелюбно, кратко, по-русски.
- Поприветствуй кандидата одним предложением и сразу задай первый вопрос.
- Это демо длительностью 26 секунд — задавай короткие вопросы, не затягивай.
- Один вопрос за раз.`;

  const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model: "gpt-realtime-2",
        instructions,
        audio: {
          output: { voice: "marin" },
        },
      },
      expires_after: { anchor: "created_at", seconds: 60 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Realtime token error:", err);
    return NextResponse.json({ error: "Ошибка создания сессии" }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ value: data.value });
}
