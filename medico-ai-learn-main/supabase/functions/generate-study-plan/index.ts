import { corsHeaders, json, callAI } from "../_shared/ai.ts";

interface Body {
  examName: string;
  examDate: string; // YYYY-MM-DD
  subjects: string[];
  weakAreas?: string;
  course?: "mbbs" | "bds";
}

function fallbackPlan(b: Body) {
  const start = new Date();
  const end = new Date(b.examDate);
  const days: any[] = [];
  const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  for (let i = 0; i < total; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const subj = b.subjects[i % b.subjects.length];
    days.push({
      date: d.toISOString().split("T")[0],
      subject: subj,
      topics: [`Study ${subj} core topics`],
      hours: 2,
    });
  }
  return { days };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    
    if (!body.examName || !body.examDate || !body.subjects?.length) {
      return json({ error: "Missing required fields" }, 400);
    }

    const course = body.course === "mbbs" ? "MBBS (medical)" : body.course === "bds" ? "BDS (dental)" : "MBBS/BDS";
    const today = new Date().toISOString().split("T")[0];
    const totalDays = Math.max(1, Math.ceil((new Date(body.examDate).getTime() - Date.now()) / 86400000));

    const system = `You are a study planner for ${course} students. Create realistic day-by-day plans referencing standard textbooks.`;
    const user = `Create a study plan from ${today} to ${body.examDate} (${totalDays} days) for exam "${body.examName}".
Subjects: ${body.subjects.join(", ")}.
${body.weakAreas ? `Weak areas to emphasize: ${body.weakAreas}.` : ""}
For each day, pick one subject, 1-3 specific topics from that subject, and study hours (1-4). Rotate subjects, give weak areas more time, include 1-2 revision days near the end.`;

    const tool = {
      name: "return_plan",
      description: "Return generated study plan",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", description: "YYYY-MM-DD" },
                subject: { type: "string" },
                topics: { type: "array", items: { type: "string" } },
                hours: { type: "number" },
              },
              required: ["date", "subject", "topics", "hours"],
            },
          },
        },
        required: ["days"],
      },
    };

    try {
      const parsed = await callAI({ system, user, tool });
      return json({ days: parsed.days ?? [] });
    } catch (apiError) {
      console.error("AI call failed, using fallback:", apiError);
      return json(fallbackPlan(body));
    }
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("generate-study-plan error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
