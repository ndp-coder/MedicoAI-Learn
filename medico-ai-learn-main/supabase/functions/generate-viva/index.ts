import { corsHeaders, json, callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    if (body.mode === "evaluate") {
      const tool = {
        name: "return_eval",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            modelAnswer: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
          },
          required: ["score", "feedback", "modelAnswer"],
        },
      };
      const out = await callAI({
        system: "You are a viva examiner for MBBS/BDS. Evaluate fairly, score 0-10, and give constructive feedback.",
        user: `Subject: ${body.subjectId}\nQuestion: ${body.question}\nStudent answer: ${body.studentAnswer}\n\nEvaluate and return score (0-10), feedback, a concise modelAnswer, strengths, and improvements.`,
        tool,
      });
      return json(out);
    }
    const { subjectId = "general", difficulty = "medium" } = body;
    const tool = {
      name: "return_viva",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                modelAnswer: { type: "string" },
                hints: { type: "array", items: { type: "string" } },
              },
              required: ["question", "modelAnswer"],
            },
          },
        },
        required: ["questions"],
      },
    };
    const out = await callAI({
      system: "You are an MBBS/BDS viva-voce examiner generating realistic oral exam questions.",
      user: `Generate 5 ${difficulty} viva questions for "${subjectId}". For each: question, concise modelAnswer, and 2-3 hints.`,
      tool,
    });
    return json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
