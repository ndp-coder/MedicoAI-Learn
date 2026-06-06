import { corsHeaders, json, callAI, mcqTool } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { weakSubjects = [] } = await req.json();
    const subjects = Array.isArray(weakSubjects) && weakSubjects.length ? weakSubjects.join(", ") : "general medical/dental";
    const out = await callAI({
      system: "You are a question writer for MBBS/BDS students. Generate rapid-fire MCQs.",
      user: `Generate 10 quick drill MCQs focused on weak areas: ${subjects}. Each has 4 options + correctIndex + concise explanation.`,
      tool: mcqTool(),
    });
    return json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
