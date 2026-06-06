import { corsHeaders, json, callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const report = await callAI({
      system: "You are an academic coach for MBBS/BDS students. Write motivating, specific, actionable progress reports in markdown.",
      user: `Write a personalized study progress report.\nStudent: ${body.studentName || "Student"}\nYear: ${body.yearOfStudy || "N/A"}\nOverall stats: ${JSON.stringify(body.overallStats)}\nPer-subject: ${JSON.stringify(body.subjectData)}\n\nInclude: summary, strengths, weak areas, exam readiness, and a 7-day action plan. Use markdown.`,
    });
    return json({ report });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
