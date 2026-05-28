import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";

// Дешёвая модель GPT-5 семейства для текстовых задач
const MODEL = "gpt-5-mini";

// reasoning почти не нужен для генерации текста — minimal даёт скорость.
const FAST = { openai: { reasoningEffort: "minimal" as const } };
const JUDGE = { openai: { reasoningEffort: "low" as const } };

// ---------- Генерация вакансии ----------

export const vacancySchema = z.object({
  description: z.string().describe("Описание позиции, 2-3 абзаца"),
  duties: z.array(z.string()).describe("Список обязанностей"),
  requirements: z.array(z.string()).describe("Список требований (must-have)"),
  conditions: z.array(z.string()).describe("Условия работы"),
});

export type GeneratedVacancy = z.infer<typeof vacancySchema>;

export interface VacancyInput {
  title: string;
  department?: string;
  grade?: string;
  stack?: string[];
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export async function generateVacancy(input: VacancyInput): Promise<GeneratedVacancy> {
  const { object } = await generateObject({
    model: openai(MODEL),
    providerOptions: FAST,
    schema: vacancySchema,
    prompt: `Ты — опытный HR в казахстанской IT-компании. Создай профессиональное описание вакансии на русском языке.

Должность: ${input.title}
${input.department ? `Отдел: ${input.department}` : ""}
${input.grade ? `Грейд: ${input.grade}` : ""}
${input.stack?.length ? `Технологии: ${input.stack.join(", ")}` : ""}
${input.location ? `Локация: ${input.location}` : ""}
${input.salaryMin || input.salaryMax ? `Зарплата: ${input.salaryMin ?? ""}–${input.salaryMax ?? ""} тенге` : ""}

Создай качественное описание, релевантные обязанности, требования и условия. Используй современную терминологию для указанного стека.`,
  });
  return object;
}

// ---------- Адаптация под площадки ----------

export async function adaptVacancy(
  vacancy: GeneratedVacancy & { title: string },
  platform: "hh" | "linkedin" | "telegram",
): Promise<string> {
  const styleMap = {
    hh: "Структурированный формат для hh.kz: чёткие разделы, маркированные списки, формально.",
    linkedin: "Narrative-формат для LinkedIn: вовлекающий тон, story-telling, призыв присоединиться к команде.",
    telegram: "Короткий формат для Telegram-канала: компактно, эмодзи, главное в первых строках.",
  };

  const { text } = await generateText({
    model: openai(MODEL),
    providerOptions: FAST,
    prompt: `Адаптируй вакансию "${vacancy.title}" под площадку. ${styleMap[platform]}

Описание: ${vacancy.description}
Обязанности: ${vacancy.duties.join("; ")}
Требования: ${vacancy.requirements.join("; ")}
Условия: ${vacancy.conditions.join("; ")}

Верни готовый текст для публикации на русском языке.`,
  });
  return text;
}

// ---------- AI-интервью: генерация вопросов ----------

export const questionsSchema = z.object({
  questions: z
    .array(z.string())
    .describe("5-7 вопросов для первичного интервью"),
});

export async function generateInterviewQuestions(vacancy: {
  title: string;
  requirements?: string | null;
  stack?: string[];
}): Promise<string[]> {
  const { object } = await generateObject({
    model: openai(MODEL),
    providerOptions: FAST,
    schema: questionsSchema,
    prompt: `Ты проводишь первичное собеседование на позицию "${vacancy.title}".
${vacancy.stack?.length ? `Стек: ${vacancy.stack.join(", ")}` : ""}
${vacancy.requirements ? `Требования: ${vacancy.requirements}` : ""}

Сгенерируй 5-7 вопросов для первичного скрининга кандидата: опыт, мотивация, ключевые технические навыки. Вопросы на русском, открытые, не да/нет.`,
  });
  return object.questions;
}

// ---------- AI-интервью: оценка ответов ----------

export const reportSchema = z.object({
  score: z.number().min(0).max(10).describe("Оценка кандидата 0-10"),
  strengths: z.array(z.string()).describe("Сильные стороны"),
  risks: z.array(z.string()).describe("Зоны риска"),
  recommendation: z
    .enum(["подходит", "возможно", "не подходит"])
    .describe("Итоговая рекомендация"),
  summary: z.string().describe("Краткое резюме по кандидату"),
});

export type InterviewReport = z.infer<typeof reportSchema>;

export async function evaluateInterview(
  vacancyTitle: string,
  qa: { question: string; answer: string }[],
): Promise<InterviewReport> {
  const transcript = qa
    .map((x, i) => `Вопрос ${i + 1}: ${x.question}\nОтвет: ${x.answer}`)
    .join("\n\n");

  const { object } = await generateObject({
    model: openai(MODEL),
    providerOptions: JUDGE,
    schema: reportSchema,
    prompt: `Ты — опытный HR. Оцени кандидата на позицию "${vacancyTitle}" по результатам первичного интервью.

${transcript}

Дай объективную оценку: скор 0-10, сильные стороны, зоны риска, рекомендацию. Будь справедлив, не завышай.`,
  });
  return object;
}
