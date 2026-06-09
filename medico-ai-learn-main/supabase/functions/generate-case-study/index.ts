import { corsHeaders, json, callAI } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    if (body.mode === "evaluate") {
      const tool = {
        name: "return_eval",
        parameters: {
          type: "object",
          properties: {
            overallScore: { type: "number" },
            diagnosisScore: { type: "number" },
            treatmentScore: { type: "number" },
            diagnosisFeedback: { type: "string" },
            treatmentFeedback: { type: "string" },
            correctDiagnosis: { type: "string" },
            idealTreatment: { type: "string" },
            missedPoints: { type: "array", items: { type: "string" } },
            clinicalPearl: { type: "string" },
          },
          required: ["overallScore", "diagnosisScore", "treatmentScore", "diagnosisFeedback", "treatmentFeedback", "correctDiagnosis", "idealTreatment", "missedPoints", "clinicalPearl"],
        },
      };
      const out = await callAI({
        system: "You evaluate clinical case responses for MBBS/BDS students. Score 0-10, give specific feedback.",
        user: `Case: ${JSON.stringify(body.caseData)}\n\nStudent diagnosis: ${body.studentDiagnosis}\nStudent treatment: ${body.studentTreatment}\n\nReturn evaluation.`,
        tool,
      });
      return json(out);
    }
    const { subjectId = "general", difficulty = "medium" } = body;
    const tool = {
      name: "return_case",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          category: { type: "string" },
          patientInfo: {
            type: "object",
            properties: { age: { type: "string" }, gender: { type: "string" }, occupation: { type: "string" } },
            required: ["age", "gender", "occupation"],
          },
          chiefComplaint: { type: "string" },
          historyOfPresentIllness: { type: "string" },
          pastMedicalHistory: { type: "string" },
          pastDentalHistory: { type: "string" },
          clinicalFindings: { type: "array", items: { type: "string" } },
          radiographicFindings: { type: "string" },
          investigations: { type: "array", items: { type: "string" } },
          questions: { type: "array", items: { type: "string" } },
        },
        required: ["title", "category", "patientInfo", "chiefComplaint", "historyOfPresentIllness", "pastMedicalHistory", "pastDentalHistory", "clinicalFindings", "radiographicFindings", "investigations", "questions"],
      },
    };
    const out = await callAI({
      system: "You write realistic clinical case studies for MBBS/BDS students.",
      user: `Generate a ${difficulty} clinical case for subject "${subjectId}". Include title, category, patient demographics, chief complaint, HPI, PMH, PDH, 4-6 clinical findings, radiographic findings, 2-4 investigations, and 3-4 thinking questions.`,
      tool,
    });
    return json(out);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
