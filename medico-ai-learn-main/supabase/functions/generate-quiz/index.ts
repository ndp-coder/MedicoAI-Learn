// Generate quiz questions via Lovable AI Gateway. Course-aware (MBBS/BDS).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  subjectId?: string;
  subjectName?: string;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  topic?: string;
  numQuestions?: number;
  course?: "mbbs" | "bds";
  year?: string | number;
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

    const n = Math.min(Math.max(body.numQuestions ?? 5, 1), 20);
    const difficulty = body.difficulty ?? "mixed";
    const course = body.course === "mbbs" ? "MBBS (medical)" : body.course === "bds" ? "BDS (dental)" : "MBBS/BDS";
    const subject = body.subjectName || body.subjectId || "general";
    const topic = body.topic ? ` on the topic "${body.topic}"` : "";

    const system = `You are a question writer for ${course} students. Generate exam-style multiple-choice questions referencing standard textbooks.`;
    const user = `Generate ${n} ${difficulty} difficulty MCQs for the subject "${subject}"${topic} for ${course} students. Each question needs 4 options, one correct answer, and a concise explanation.`;

    const tool = {
      type: "function",
      function: {
        name: "return_quiz",
        description: "Return generated MCQs",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                  correctIndex: { type: "integer", minimum: 0, maximum: 3 },
                  explanation: { type: "string" },
                  subjectId: { type: "string" },
                },
                required: ["question", "options", "correctIndex", "explanation"],
                additionalProperties: false,
              },
            },
          },
          required: ["questions"],
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
        tool_choice: { type: "function", function: { name: "return_quiz" } },
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await resp.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      console.error("No tool call returned:", JSON.stringify(json).slice(0, 500));
      return new Response(JSON.stringify({ error: "No questions generated" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const parsed = JSON.parse(args);
    const questions = (parsed.questions ?? []).map((q: any) => ({
      ...q,
      subjectId: q.subjectId || body.subjectId || undefined,
    }));

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
