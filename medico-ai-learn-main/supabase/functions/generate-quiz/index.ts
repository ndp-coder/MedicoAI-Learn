import { corsHeaders, json, callAI } from "../_shared/ai.ts";

interface Body {
  subjectId?: string;
  subjectName?: string;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  topic?: string;
  numQuestions?: number;
  course?: "mbbs" | "bds";
  year?: string | number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;

    const n = Math.min(Math.max(body.numQuestions ?? 5, 1), 20);
    const difficulty = body.difficulty ?? "mixed";
    const course = body.course === "mbbs" ? "MBBS (medical)" : body.course === "bds" ? "BDS (dental)" : "MBBS/BDS";
    const subject = body.subjectName || body.subjectId || "general";
    const topic = body.topic ? ` on the topic "${body.topic}"` : "";

    const system = `You are a question writer for ${course} students. Generate exam-style multiple-choice questions referencing standard textbooks.`;
    const user = `Generate ${n} ${difficulty} difficulty MCQs for the subject "${subject}"${topic} for ${course} students. Each question needs 4 options, one correct answer, and a concise explanation.`;

    const tool = {
      name: "return_quiz",
      description: "Return generated MCQs",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correctIndex: { type: "integer" },
                explanation: { type: "string" },
                subjectId: { type: "string" },
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
        },
        required: ["questions"],
      },
    };

    const parsed = await callAI({ system, user, tool });
    const questions = (parsed.questions ?? []).map((q: any) => ({
      ...q,
      subjectId: q.subjectId || body.subjectId || undefined,
    }));

    return json({ questions });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("generate-quiz error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
