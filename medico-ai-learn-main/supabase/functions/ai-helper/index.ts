// Edge function for non-streaming AI helpers (explain mistake, evaluate case answer)
// Uses Lovable AI Gateway

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExplainMistakePayload {
  action: "explain-mistake";
  question: string;
  options: string[];
  correctIndex: number;
  chosenIndex?: number;
  subject?: string;
}

interface EvaluateCasePayload {
  action: "evaluate-case";
  scenario: string;
  question: string;
  modelAnswer: string;
  userAnswer: string;
}

interface ExplainDiagramPayload {
  action: "explain-diagram";
  imageDataUrl: string;
  customPrompt?: string;
}

interface SummarizeNotesPayload {
  action: "summarize-notes";
  text: string;
  mode?: "summary" | "cheatsheet" | "mnemonics" | "questions";
  subject?: string;
}

interface TranscribeLecturePayload {
  action: "transcribe-lecture";
  audioDataUrl: string; // data:audio/webm;base64,...
  mimeType?: string;
}

interface GenerateCardsPayload {
  action: "generate-cards";
  text: string;
  count?: number;
  subject?: string;
}

type Payload =
  | ExplainMistakePayload
  | EvaluateCasePayload
  | ExplainDiagramPayload
  | SummarizeNotesPayload
  | TranscribeLecturePayload
  | GenerateCardsPayload;



function buildPrompt(p: Payload): { system: string; user: string } {
  if (p.action === "explain-mistake") {
    const chosen =
      typeof p.chosenIndex === "number" ? p.options[p.chosenIndex] : "(not recorded)";
    return {
      system:
        "You are a friendly dental tutor. Given a multiple-choice question the student got wrong, explain in 3 short lines why the correct answer is right and the chosen answer is wrong. End with one memorable mnemonic or memory hook (1 line). Use plain language. Format as markdown.",
      user: `Subject: ${p.subject ?? "Dentistry"}
Question: ${p.question}
Options:
${p.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}
Correct answer: ${p.options[p.correctIndex]}
Student chose: ${chosen}

Give a 3-line explanation + 1-line memory hook.`,
    };
  }
  if (p.action === "summarize-notes") {
    const mode = p.mode ?? "summary";
    const modeInstructions: Record<string, string> = {
      summary:
        "Produce a clean structured **Summary**: 3-6 short sections with headings and tight bullet points. End with a 'Quick recap' line.",
      cheatsheet:
        "Produce a **Cheat Sheet**: dense, scannable, grouped by topic. Use tables where useful, short bullets, key terms in **bold**, and numbers/values highlighted. No fluff.",
      mnemonics:
        "Produce **Mnemonics & Memory Hooks**: for each key concept give a vivid mnemonic, acronym, or analogy. Format as a list. Add a 'Why it sticks' one-liner per item.",
      questions:
        "Produce **Practice Questions**: 8-10 high-yield Q&A pairs covering the material. Format as numbered list with **Q:** then **A:** on next line.",
    };
    return {
      system:
        "You are an expert tutor that turns student notes into clear, exam-ready study material. Output rich markdown.",
      user: `Subject: ${p.subject ?? "General"}
Mode: ${mode}

${modeInstructions[mode]}

--- STUDENT NOTES START ---
${p.text}
--- STUDENT NOTES END ---`,
    };
  }
  if (p.action === "generate-cards") {
    const count = Math.min(Math.max(p.count ?? 12, 4), 25);
    return {
      system:
        "You generate spaced-repetition flashcards from study material. Respond ONLY with a JSON array (no markdown fences, no prose). Each item: { \"q\": \"short prompt or question\", \"a\": \"concise answer (1-2 sentences max)\" }. Cover the most important, testable facts. Avoid trivial or duplicate cards.",
      user: `Subject: ${p.subject ?? "General"}
Create ${count} high-yield flashcards from the following material. Return JSON only.

--- MATERIAL START ---
${p.text}
--- MATERIAL END ---`,
    };
  }

  if (p.action === "evaluate-case") {
    return {
      system:
        "You are a dental clinical examiner. Evaluate a student's answer to a clinical case question. Give: (1) a score out of 10, (2) what they got right (2 lines), (3) what they missed (2 lines), (4) one improvement tip. Be encouraging but honest. Format as markdown.",
      user: `Clinical scenario: ${p.scenario}
Question: ${p.question}
Model answer (reference): ${p.modelAnswer}
Student answer: ${p.userAnswer}

Evaluate the student answer.`,
    };
  }
  return { system: "", user: "" };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    if (!body || !("action" in body)) {
      return new Response(JSON.stringify({ error: "Missing action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let messages: any[];
    let model = "google/gemini-2.5-flash";
    if (body.action === "explain-diagram") {
      const systemMsg =
        "You are a friendly dental tutor explaining a diagram/image to a student. Give: (1) **What it shows** (2-3 lines identifying structures), (2) **Key points to understand** (3-4 bullet points), (3) **How to remember it** (a vivid mnemonic, analogy, or memory hook). Use markdown. Be concise but rich.";
      const userText = body.customPrompt?.trim()
        ? `Student's specific question: ${body.customPrompt}\n\nExplain this diagram with focus on the above.`
        : "Explain this dental/medical diagram and give me a memory hook to remember it.";
      messages = [
        { role: "system", content: systemMsg },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: body.imageDataUrl } },
          ],
        },
      ];
    } else if (body.action === "transcribe-lecture") {
      const systemMsg =
        "You are an expert academic note-taker. Listen to the recorded lecture audio and produce: (1) **Transcript** (clean, paragraphed, fix obvious filler), (2) **Structured Notes** (headings + bullets of key concepts), (3) **Key Terms** (bullet list with 1-line definitions), (4) **5 Practice Questions** with answers. Output rich markdown.";
      messages = [
        { role: "system", content: systemMsg },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcribe and structure this lecture recording." },
            {
              type: "input_audio",
              input_audio: {
                data: body.audioDataUrl.includes(",")
                  ? body.audioDataUrl.split(",")[1]
                  : body.audioDataUrl,
                format: (body.mimeType ?? "audio/webm").includes("wav") ? "wav" : "webm",
              },
            },
          ],
        },
      ];
    } else {
      const { system, user } = buildPrompt(body);
      messages = [
        { role: "system", content: system },
        { role: "user", content: user },
      ];
    }


    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      },
    );

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("Gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content: string =
      data.choices?.[0]?.message?.content ?? "(no response)";

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-helper error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
