import { corsHeaders, json, callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { imageBase64, mimeType = "image/jpeg" } = await req.json();
    if (!imageBase64) return json({ error: "imageBase64 required" }, 400);
    const text = await callAI({
      system: "You are an OCR engine. Extract all handwritten or printed text from the image. Return clean, readable text preserving line breaks. No commentary.",
      user: [
        { type: "text", text: "Extract all text from this image. Preserve structure with line breaks. Output text only." },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ] as any,
    });
    return json({ text });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
