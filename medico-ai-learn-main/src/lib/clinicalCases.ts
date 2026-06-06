export interface CaseQuestion {
  prompt: string;
  modelAnswer: string;
}

export interface ClinicalCase {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  subject: string;
  scenario: string;
  questions: CaseQuestion[];
}

export const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: "case-001",
    title: "Throbbing Tooth Pain",
    difficulty: "easy",
    subject: "Endodontics",
    scenario:
      "A 35-year-old male presents with severe, spontaneous, throbbing pain in the lower-right first molar. Pain wakes him at night and is aggravated by hot drinks but relieved by cold water. Tooth has a large MOD amalgam. No mobility, no swelling. EPT: no response. Cold test: lingering pain >30 sec.",
    questions: [
      {
        prompt: "What is the most likely pulpal diagnosis and why?",
        modelAnswer:
          "Symptomatic irreversible pulpitis. Spontaneous pain, lingering response to thermal stimulus (>30 sec), and night pain are classic signs. Relief by cold suggests gas expansion within necrotic tissue (sometimes a feature of necrotic pulps), but EPT being negative may indicate partial necrosis.",
      },
      {
        prompt: "What is your immediate treatment plan?",
        modelAnswer:
          "Local anesthesia (IANB), rubber dam isolation, access cavity through the existing amalgam, pulp extirpation, working-length determination, complete cleaning & shaping, and either single-visit RCT with obturation or interim Ca(OH)₂ dressing. Provide analgesics (ibuprofen 400 mg PRN).",
      },
    ],
  },
  {
    id: "case-002",
    title: "Bleeding Gums",
    difficulty: "easy",
    subject: "Periodontics",
    scenario:
      "A 28-year-old female complains of bleeding gums when brushing for the past 3 months. She brushes once daily, never flosses. Examination: generalized marginal erythema, BOP 65%, no pocketing >3 mm, no recession, no mobility. Plaque score: 70%. No systemic disease.",
    questions: [
      {
        prompt: "What is your diagnosis?",
        modelAnswer:
          "Plaque-induced gingivitis (generalized). No attachment loss, no deep pockets — consistent with reversible gingival inflammation due to poor plaque control.",
      },
      {
        prompt: "Outline the management plan.",
        modelAnswer:
          "1) Oral hygiene instructions: modified Bass technique, twice daily brushing, daily flossing/interdental brushes. 2) Professional scaling and polishing. 3) 0.12% chlorhexidine mouthwash for 2 weeks. 4) Review at 4–6 weeks to reassess BOP and plaque score. 5) Maintenance recall every 6 months.",
      },
    ],
  },
  {
    id: "case-003",
    title: "Swollen Face After Extraction",
    difficulty: "medium",
    subject: "Oral Surgery",
    scenario:
      "A 45-year-old diabetic patient presents 3 days after extraction of lower-left third molar. Severe throbbing pain, foul taste, halitosis. No facial swelling but trismus (~25 mm opening). Socket appears empty with exposed bone, no granulation tissue. Temperature: 37.4°C.",
    questions: [
      {
        prompt: "What is the diagnosis?",
        modelAnswer:
          "Alveolar osteitis (dry socket). Classic triad: severe pain 2–4 days post-extraction, exposed bone in empty socket, foul odor. Risk factors here: lower 3rd molar extraction and diabetes (impaired healing).",
      },
      {
        prompt: "How will you manage this patient?",
        modelAnswer:
          "1) Gentle irrigation of socket with warm saline or chlorhexidine. 2) Place obtundent dressing (Alvogyl / zinc oxide eugenol on iodoform gauze). 3) Systemic analgesics (NSAID + paracetamol). 4) Antibiotics only if signs of spreading infection. 5) Diabetic control review. 6) Recall in 24–48 h for dressing change.",
      },
    ],
  },
  {
    id: "case-004",
    title: "White Patch on Tongue",
    difficulty: "hard",
    subject: "Oral Medicine",
    scenario:
      "A 58-year-old male smoker (30 pack-years), regular alcohol use, presents with a non-scrapable, well-defined white patch on the lateral border of the tongue noticed 6 weeks ago. Painless, no induration, no lymphadenopathy.",
    questions: [
      {
        prompt: "What is your differential diagnosis? Pick the most likely.",
        modelAnswer:
          "Differentials: leukoplakia (most likely given risk factors and non-scrapable nature), lichen planus, hyperkeratosis from chronic trauma, frictional keratosis, candidiasis. Lateral tongue location + smoker + alcohol = high-risk leukoplakia with malignant transformation potential.",
      },
      {
        prompt: "What investigations and management will you perform?",
        modelAnswer:
          "1) Detailed history including chronic trauma source. 2) Photograph & document size. 3) Eliminate any local irritant (sharp tooth). 4) Review in 2 weeks — if persists, INCISIONAL BIOPSY is mandatory to rule out dysplasia/carcinoma. 5) Refer to oral surgeon/oncologist if dysplastic. 6) Counsel on smoking/alcohol cessation. 7) Long-term follow-up.",
      },
    ],
  },
  {
    id: "case-005",
    title: "Anterior Crossbite in a Child",
    difficulty: "medium",
    subject: "Orthodontics",
    scenario:
      "A 9-year-old presents with upper-left central incisor (#21) in crossbite with lower incisors. Mixed dentition. Functional shift on closing. No skeletal discrepancy. Patient can achieve edge-to-edge bite manually.",
    questions: [
      {
        prompt: "What is the diagnosis and urgency?",
        modelAnswer:
          "Single-tooth dental anterior crossbite with functional mandibular shift. Urgent — uncorrected crossbite causes abnormal wear, gingival recession on the lower incisor, and may promote Class III skeletal growth pattern.",
      },
      {
        prompt: "What treatment options would you offer?",
        modelAnswer:
          "1) Removable Hawley appliance with Z-spring/finger spring to push #21 labially. 2) Composite inclined plane bonded to lower incisors (catlin / 2×4 appliance). 3) Fixed 2×4 appliance with NiTi wire if multiple teeth. Treatment duration: 6–8 weeks. Retention with Hawley until permanent dentition. Monitor occlusion.",
      },
    ],
  },
  {
    id: "case-006",
    title: "Trauma to Upper Incisor",
    difficulty: "hard",
    subject: "Pediatric Dentistry",
    scenario:
      "A 12-year-old child was hit by a ball 30 minutes ago. Upper-right central incisor (#11) avulsed completely. Parent brought the tooth in milk. Tooth root looks clean, apex closed.",
    questions: [
      {
        prompt: "What is the immediate management?",
        modelAnswer:
          "TIME-CRITICAL. 1) Reassure patient. 2) Hold tooth by crown only — do NOT touch root. 3) If root clean, replant immediately into socket after gentle saline rinse (5–10 sec). 4) Stabilize with flexible splint for 2 weeks. 5) Tetanus prophylaxis check. 6) Systemic antibiotics (doxycycline if >12 yr, else amoxicillin). 7) Soft diet, chlorhexidine rinse. 8) Pulp follow-up: closed apex → initiate RCT at 7–10 days.",
      },
      {
        prompt: "What is the prognosis and follow-up plan?",
        modelAnswer:
          "Prognosis depends on extra-alveolar dry time (<60 min in physiologic media = good). Risks: external root resorption (inflammatory/replacement) and ankylosis. Follow-up: 2 weeks (splint removal), 1 month, 3 months, 6 months, then yearly with radiographs to monitor for resorption.",
      },
    ],
  },
  {
    id: "case-007",
    title: "Failed Crown",
    difficulty: "medium",
    subject: "Prosthodontics",
    scenario:
      "A 50-year-old female reports recurrent crown debonding on #14 (upper left first premolar). Crown has come off 3 times in 18 months. Original PFM crown placed 4 years ago. Tooth has short clinical crown, supragingival margins, no caries on radiograph.",
    questions: [
      {
        prompt: "What are the likely causes of repeated debonding?",
        modelAnswer:
          "1) Inadequate retention form: short clinical crown height (<3 mm), excessive taper (>10°), insufficient surface area. 2) Improper occlusal scheme — heavy lateral excursions or working-side interference. 3) Use of weak luting cement (e.g., zinc phosphate where resin would be better). 4) Contamination during cementation.",
      },
      {
        prompt: "How will you manage this case?",
        modelAnswer:
          "1) Assess crown-to-root ratio & remaining tooth structure. 2) Consider crown lengthening surgery to increase clinical crown height. 3) Add retentive grooves or a post-and-core if needed. 4) Evaluate occlusion — adjust interferences, possibly night guard. 5) New crown with proper taper (≤10°), adequate axial wall height. 6) Cement with resin luting agent after proper isolation and tooth-surface treatment.",
      },
    ],
  },
  {
    id: "case-008",
    title: "Burning Mouth",
    difficulty: "hard",
    subject: "Oral Medicine",
    scenario:
      "A 62-year-old post-menopausal female complains of constant burning sensation on tongue and palate for 6 months. No visible lesions. Normal salivary flow. No oral candidiasis. Hb 10.5 g/dL, B12 borderline-low, fasting glucose 145 mg/dL.",
    questions: [
      {
        prompt: "What is your diagnosis & differential?",
        modelAnswer:
          "Primary burning mouth syndrome (BMS) is a diagnosis of exclusion. Here, multiple secondary causes are present: iron-deficiency anemia, low B12, undiagnosed diabetes. So this is more likely SECONDARY BMS with multifactorial etiology, not primary BMS. Differentials: candidiasis (ruled out), xerostomia (normal flow), GERD, contact stomatitis.",
      },
      {
        prompt: "What is the management plan?",
        modelAnswer:
          "1) Address each secondary cause: iron supplementation, B12 supplementation, refer to GP for diabetes management. 2) Saliva substitutes if needed. 3) Topical clonazepam rinse or capsaicin if symptoms persist after correction. 4) Alpha-lipoic acid 600 mg/day trial. 5) Psychological support / CBT if chronic. 6) Review at 6 weeks.",
      },
    ],
  },
];

export function getCaseById(id: string): ClinicalCase | undefined {
  return CLINICAL_CASES.find((c) => c.id === id);
}
