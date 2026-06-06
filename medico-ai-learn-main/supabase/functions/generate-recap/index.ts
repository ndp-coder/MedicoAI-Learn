import { corsHeaders, json, callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { topic, subject } = await req.json();
    const tool = {
      type: "function",
      function: {
        name: "return_recap",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "array", items: { type: "string" } },
            keyTerms: { type: "array", items: { type: "string" } },
            practiceQuestions: {
              type: "array",
              items: {
                type: "object",
                properties: { question: { type: "string" }, answer: { type: "string" } },
                required: ["question", "answer"],
              },
            },
            quickTip: { type: "string" },
            bookReference: { type: "string" },
          },
          required: ["summary", "keyTerms", "practiceQuestions", "quickTip", "bookReference"],
        },
      },
    };
    const out = await callAI({
      system: "You are an MBBS/BDS tutor creating concise topic recaps. Reference standard textbooks.",
      user: `Create a topic recap for "${topic}"${subject ? ` (subject reference: ${subject})` : ""}.\nProvide: 5-7 summary bullets, 6-10 key terms, 3-5 practice Q&A, one quickTip, and a bookReference (e.g. "Gray's Anatomy, Ch 5" or "Shafer's Oral Pathology, Ch 3").`,
      tool,
    });
    return json({ recap: out });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
