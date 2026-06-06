// Generate a personalized study plan via Lovable AI Gateway. Course-aware.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.examName || !body.examDate || !body.subjects?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      type: "function",
      function: {
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
                additionalProperties: false,
              },
            },
          },
          required: ["days"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_plan" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      // Fall back to a basic rotation plan rather than failing
      return new Response(JSON.stringify(fallbackPlan(body)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await resp.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify(fallbackPlan(body)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(args);
    return new Response(JSON.stringify({ days: parsed.days ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-study-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
