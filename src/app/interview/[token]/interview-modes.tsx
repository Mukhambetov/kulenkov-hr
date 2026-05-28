"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InterviewChat } from "./interview-chat";
import { VoiceInterview } from "./voice-interview";
import { MessageSquare, Mic } from "lucide-react";

export function InterviewModes({
  token,
  questions,
}: {
  token: string;
  questions: string[];
}) {
  return (
    <Tabs defaultValue="chat">
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="chat">
          <MessageSquare className="mr-2 h-4 w-4" /> Чат
        </TabsTrigger>
        <TabsTrigger value="voice">
          <Mic className="mr-2 h-4 w-4" /> Голос (демо)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="chat">
        <InterviewChat token={token} questions={questions} />
      </TabsContent>
      <TabsContent value="voice">
        <VoiceInterview token={token} />
      </TabsContent>
    </Tabs>
  );
}
