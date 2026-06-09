const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export type MsgContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
export type Msg = { role: "user" | "assistant"; content: MsgContent };

export type ResponseMode = "brief" | "detailed" | "brief-general" | "detailed-general"
  // legacy values kept for backward compatibility with stored localStorage
  | "brief-dental" | "detailed-dental";

export interface AIPreferences {
  languageStyle?: "simple" | "technical";
  answerFormat?: "paragraphs" | "bullets" | "tables" | "step-by-step";
}

export interface ChatContext {
  course?: "mbbs" | "bds";
  year?: number | string;
  subjects?: Array<{ name: string; book?: string; author?: string }>;
}

export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
  responseMode = "detailed",
  aiPreferences,
  context,
}: {
  messages: Msg[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError?: (error: string) => void;
  responseMode?: ResponseMode;
  aiPreferences?: AIPreferences;
  context?: ChatContext;
  priority?: boolean;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages,
      responseMode,
      aiPreferences,
      course: context?.course,
      year: context?.year,
      subjects: context?.subjects,
      priority,
    }),
  });

  if (resp.status === 429) { onError?.("Rate limit exceeded. Please wait a moment and try again."); return; }
  if (resp.status === 402) { onError?.("AI usage limit reached. Please try again later."); return; }
  if (!resp.ok || !resp.body) { onError?.("Failed to get AI response. Please try again."); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
