import { corsHeaders, json, callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { subjectId = "general" } = await req.json();
    const content = await callAI({
      system: "You generate concise, exam-ready formula and key-fact cheat sheets for MBBS/BDS students. Use clear markdown with headings, bullets, and tables.",
      user: `Create a comprehensive formula & key-fact sheet for the subject: "${subjectId}". Include must-know values, classifications, equations, mnemonics, and clinical pearls. Markdown only.`,
    });
    return json({ content });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
