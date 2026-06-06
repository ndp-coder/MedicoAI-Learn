// Streaming chat for Ask a Doubt. Course-aware (MBBS / BDS).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ResponseMode = "brief" | "detailed" | "brief-general" | "detailed-general"
  | "brief-dental" | "detailed-dental"; // legacy

interface SubjectCtx {
  name: string;
  book?: string;
  author?: string;
}

interface Body {
  messages: any[];
  responseMode?: ResponseMode;
  course?: "mbbs" | "bds";
  year?: number | string;
  subjects?: SubjectCtx[];
  aiPreferences?: {
    languageStyle?: "simple" | "technical";
    answerFormat?: "paragraphs" | "bullets" | "tables" | "step-by-step";
  };
}

function buildSystemPrompt(b: Body): string {
  const course = b.course === "mbbs" ? "mbbs" : b.course === "bds" ? "bds" : null;
  const mode = b.responseMode ?? "detailed";
  const isGeneral = mode.includes("general");
  const isBrief = mode.includes("brief");

  const discipline = course === "mbbs"
    ? "MBBS (medical)"
    : course === "bds"
    ? "BDS (dental)"
    : "MBBS/BDS (medical & dental)";

  const subjectList = (b.subjects ?? [])
    .map(s => s.book ? `${s.name} — ${s.book}${s.author ? ` by ${s.author}` : ""}` : s.name)
    .join("; ");

  const scope = isGeneral
    ? `Answer broadly across medical and health sciences. Use the student's ${discipline} background for context.`
    : course
    ? `Focus answers on the ${discipline} curriculum.${subjectList ? ` Student's selected subjects and textbooks: ${subjectList}.` : ""} You have access to all standard ${discipline} textbooks across all years; cite the most relevant standard textbook for the topic (e.g. Gray's/BD Chaurasia for anatomy, Guyton for physiology, Harsh Mohan for pathology, KD Tripathi for pharmacology, Shafer's for oral pathology, Wheeler's for dental anatomy, etc.).`
    : `Focus on the student's medical/dental curriculum.${subjectList ? ` Subjects: ${subjectList}.` : ""}`;

  const length = isBrief
    ? "Keep answers concise: 3–6 lines, high-yield, exam-ready."
    : "Give a detailed, structured explanation suitable for exam prep. Use headings, bullets, and clinical relevance.";

  const prefs: string[] = [];
  if (b.aiPreferences?.languageStyle === "simple") prefs.push("Use simple, plain language.");
  if (b.aiPreferences?.languageStyle === "technical") prefs.push("Use precise medical terminology.");
  if (b.aiPreferences?.answerFormat === "bullets") prefs.push("Format as bullet points.");
  if (b.aiPreferences?.answerFormat === "tables") prefs.push("Use markdown tables where useful.");
  if (b.aiPreferences?.answerFormat === "step-by-step") prefs.push("Format as numbered steps.");

  return `You are MedicoAI, an expert tutor for ${discipline} students. ${scope}

${length}
${prefs.join(" ")}

IMPORTANT: At the end of every response, on a new line, add a source tag:
- Specific textbook: 📖 Source: [Book Name]
- General knowledge: 🧠 Source: General Knowledge
- Multiple books: 📖 Sources: [Book 1], [Book 2]`;
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

    const system = buildSystemPrompt(body);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: system },
          ...(body.messages ?? []),
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
