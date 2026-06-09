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
  stream?: boolean;
}) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  
  const model = opts.model ?? "gemini-2.5-flash";
  
  // Format contents for Gemini
  let parts: any[] = [];
  if (Array.isArray(opts.user)) {
    // Already in Gemini format (e.g. from generate-ocr) or we need to map it
    parts = opts.user.map(u => {
      if (u.inlineData) return u; // Already Gemini format
      if (u.type === "text") return { text: u.text };
      if (u.type === "image_url") {
        // Map OpenAI image_url format to Gemini inlineData if accidentally passed
        const url = u.image_url.url as string;
        const [meta, data] = url.split(',');
        const mimeType = meta.split(';')[0].replace('data:', '');
        return { inlineData: { mimeType, data } };
      }
      return u;
    });
  } else {
    parts = [{ text: opts.user }];
  }

  const body: any = {
    contents: [{ role: "user", parts }],
  };

  if (opts.system) {
    body.systemInstruction = {
      parts: [{ text: opts.system }]
    };
  }

  if (opts.tool) {
    body.tools = [{
      functionDeclarations: [opts.tool]
    }];
    body.toolConfig = {
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: [opts.tool.name]
      }
    };
  }

  const endpoint = opts.stream 
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (resp.status === 429) throw new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (!resp.ok) {
    const t = await resp.text();
    console.error("Gemini API error", resp.status, t);
    throw new Error(`Gemini API error: ${resp.status}`);
  }

  if (opts.stream) {
    return resp;
  }

  const j = await resp.json();
  const part = j?.candidates?.[0]?.content?.parts?.[0];

  
  if (!part) {
    throw new Error("No content returned from AI");
  }

  if (opts.tool) {
    if (!part.functionCall || !part.functionCall.args) {
      console.error("Expected function call, got:", JSON.stringify(part));
      throw new Error("No tool call returned");
    }
    return part.functionCall.args;
  }
  
  return part.text ?? "";
}

export function mcqTool(name = "return_questions") {
  return {
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
  };
}
