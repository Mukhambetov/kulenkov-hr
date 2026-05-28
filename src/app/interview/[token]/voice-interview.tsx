"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

const DEMO_SECONDS = 26;

type State = "idle" | "connecting" | "live" | "done" | "error";

export function VoiceInterview({ token }: { token: string }) {
  const [state, setState] = useState<State>("idle");
  const [remaining, setRemaining] = useState(DEMO_SECONDS);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current = null;
  };

  const stop = () => {
    cleanup();
    setState("done");
  };

  const start = async () => {
    setState("connecting");
    try {
      // 1. Эфемерный токен с сервера
      const tokenRes = await fetch("/api/realtime/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!tokenRes.ok) throw new Error("token");
      const { value: ephemeralKey } = await tokenRes.json();

      // 2. WebRTC peer connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Воспроизведение аудио от модели
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // Микрофон кандидата
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);

      pc.createDataChannel("oai-events");

      // 3. SDP offer → OpenAI Realtime
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });
      const answer = { type: "answer" as const, sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);

      setState("live");

      // 4. Таймер демо — 26 секунд
      setRemaining(DEMO_SECONDS);
      timerRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            stop();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } catch {
      cleanup();
      setState("error");
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        {state === "idle" && (
          <>
            <p className="text-sm text-muted-foreground">
              Голосовое интервью с AI (демо, {DEMO_SECONDS} сек). Разрешите доступ
              к микрофону.
            </p>
            <Button onClick={start}>
              <Mic className="mr-2 h-4 w-4" /> Начать голосовое интервью
            </Button>
          </>
        )}
        {state === "connecting" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Подключение...</p>
          </>
        )}
        {state === "live" && (
          <>
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
              <Mic className="relative h-10 w-10 text-primary" />
            </div>
            <p className="text-2xl font-bold tabular-nums">{remaining}с</p>
            <p className="text-sm text-muted-foreground">
              Говорите — AI слушает и отвечает
            </p>
            <Button variant="outline" size="sm" onClick={stop}>
              <MicOff className="mr-2 h-4 w-4" /> Завершить
            </Button>
          </>
        )}
        {state === "done" && (
          <p className="text-sm font-medium">Демо-интервью завершено. Спасибо!</p>
        )}
        {state === "error" && (
          <>
            <p className="text-sm text-destructive">
              Не удалось подключиться. Проверьте микрофон и OPENAI_API_KEY.
            </p>
            <Button variant="outline" size="sm" onClick={() => setState("idle")}>
              Попробовать снова
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
