import { corsHeaders, json, callAI, mcqTool } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { count = 30 } = await req.json();
    const n = Math.min(Math.max(count, 5), 100);
    const out = await callAI({
      system: "You are an MBBS/BDS mock-exam question writer. Generate balanced, exam-style MCQs covering multiple subjects.",
      user: `Generate ${n} mixed-subject MCQs for a mock exam. Vary difficulty. Each: 4 options, correctIndex, explanation, and a subjectId from the subject area (e.g. anatomy, physiology, pathology, pharmacology, oral-pathology, dental-anatomy).`,
      tool: mcqTool(),
    });
    return json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
