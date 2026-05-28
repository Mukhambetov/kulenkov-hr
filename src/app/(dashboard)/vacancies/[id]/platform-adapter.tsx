"use client";

import { useState, useTransition } from "react";
import { adaptVacancyForPlatform } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

type Platform = "hh" | "linkedin" | "telegram";

export function PlatformAdapter({
  vacancyId,
  versions,
}: {
  vacancyId: string;
  versions: { hh: string | null; linkedin: string | null; telegram: string | null };
}) {
  const [texts, setTexts] = useState(versions);
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<Platform>("hh");

  const generate = (platform: Platform) => {
    startTransition(async () => {
      try {
        const text = await adaptVacancyForPlatform(vacancyId, platform);
        setTexts((t) => ({ ...t, [platform]: text }));
        toast.success("Адаптировано");
      } catch {
        toast.error("Ошибка адаптации");
      }
    });
  };

  const labels: Record<Platform, string> = {
    hh: "hh.kz",
    linkedin: "LinkedIn",
    telegram: "Telegram",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Адаптация под площадки</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={(v) => setActive(v as Platform)}>
          <TabsList className="grid w-full grid-cols-3">
            {(Object.keys(labels) as Platform[]).map((p) => (
              <TabsTrigger key={p} value={p}>
                {labels[p]}
              </TabsTrigger>
            ))}
          </TabsList>
          {(Object.keys(labels) as Platform[]).map((p) => (
            <TabsContent key={p} value={p} className="space-y-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => generate(p)}
                disabled={pending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {texts[p] ? "Перегенерировать" : "Сгенерировать"}
              </Button>
              <Textarea
                rows={16}
                value={texts[p] ?? ""}
                readOnly
                placeholder={`Адаптированная версия для ${labels[p]} появится здесь`}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
