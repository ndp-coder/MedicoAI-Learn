// Shared helpers for AI Gateway calls
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function callAI(opts: {
  system: string;
  user: string | any[];
  tool?: any;
  model?: string;
}) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const body: any = {
    model: opts.model ?? "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user as any },
    ],
  };
  if (opts.tool) {
    body.tools = [opts.tool];
    body.tool_choice = { type: "function", function: { name: opts.tool.function.name } };
  }
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (resp.status === 429) throw new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (resp.status === 402) throw new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!resp.ok) {
    const t = await resp.text();
    console.error("AI gateway error", resp.status, t);
    throw new Error("AI gateway error");
  }
  const j = await resp.json();
  if (opts.tool) {
    const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No tool call returned");
    return JSON.parse(args);
  }
  return j?.choices?.[0]?.message?.content ?? "";
}

export function mcqTool(name = "return_questions") {
  return {
    type: "function",
    function: {
      name,
      description: "Return MCQs",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correctIndex: { type: "integer" },
                explanation: { type: "string" },
                subjectId: { type: "string" },
              },
              required: ["question", "options", "correctIndex", "explanation"],
            },
          },
        },
        required: ["questions"],
      },
    },
  };
}
