import { corsHeaders, json, callAI, mcqTool } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { topic, summary = [], keyTerms = [], bookReference = "" } = await req.json();
    const out = await callAI({
      system: "You are an MBBS/BDS tutor generating recap quizzes that reinforce a topic.",
      user: `Generate 5 MCQs for the topic "${topic}". Use these summary points: ${summary.join("; ")}. Key terms: ${keyTerms.join(", ")}. Reference: ${bookReference}. Each: 4 options, correctIndex, explanation.`,
      tool: mcqTool(),
    });
    return json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
