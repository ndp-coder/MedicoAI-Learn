import { corsHeaders, json, callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { imageBase64, imageType = "image/jpeg" } = await req.json();
    if (!imageBase64) return json({ error: "imageBase64 required" }, 400);
    const tool = {
      name: "return_diagram_quiz",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string" },
          structuresIdentified: { type: "array", items: { type: "string" } },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correctIndex: { type: "integer" },
                explanation: { type: "string" },
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
        },
        required: ["description", "structuresIdentified", "questions"],
      },
    };
    const out = await callAI({
      system: "You analyze medical/dental diagrams and create quizzes from them.",
      user: [
        { text: "Analyze this diagram. Provide a short description, list the labeled structures, and generate 5 MCQs based on it (4 options each, correctIndex, explanation)." },
        { inlineData: { mimeType: imageType, data: imageBase64 } },
      ],
      tool,
    });
    return json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
