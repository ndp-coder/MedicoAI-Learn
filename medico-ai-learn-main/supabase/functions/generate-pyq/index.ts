import { corsHeaders, json, callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subjectId = "general", yearStyle = "recent", marksType = "mixed" } = await req.json();
    const tool = {
      name: "return_paper",
      parameters: {
        type: "object",
        properties: {
          paperTitle: { type: "string" },
          totalMarks: { type: "number" },
          duration: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                marks: { type: "number" },
                type: { type: "string" },
                answer: { type: "string" },
              },
              required: ["question", "marks", "answer"],
            },
          },
        },
        required: ["paperTitle", "totalMarks", "duration", "questions"],
      },
    };
    const out = await callAI({
      system: "You write previous-year-style exam papers for MBBS/BDS students with model answers.",
      user: `Generate a ${yearStyle} previous-year style question paper for ${subjectId}. Marks distribution: ${marksType}. Include 8-12 questions with marks, type (short/long/MCQ), and a concise model answer. Provide a paperTitle, totalMarks, and duration.`,
      tool,
    });
    return json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
