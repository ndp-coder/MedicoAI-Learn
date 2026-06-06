// Daily Challenge: one curated MCQ set per day. Same for every user (seeded by date).

export interface ChallengeMCQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subject: string;
}

const POOL: ChallengeMCQ[] = [
  {
    question: "Which cell is responsible for enamel formation?",
    options: ["Odontoblast", "Ameloblast", "Cementoblast", "Osteoblast"],
    correctIndex: 1,
    explanation: "Ameloblasts secrete enamel matrix during amelogenesis. They die after enamel formation is complete.",
    subject: "Histology",
  },
  {
    question: "The hardest tissue in the human body is:",
    options: ["Bone", "Dentin", "Enamel", "Cementum"],
    correctIndex: 2,
    explanation: "Enamel is ~96% inorganic (hydroxyapatite), making it the hardest tissue. However, it is brittle.",
    subject: "Anatomy",
  },
  {
    question: "Maxillary sinus is closely related to which teeth?",
    options: ["Lower molars", "Upper premolars and molars", "Upper anteriors", "Lower premolars"],
    correctIndex: 1,
    explanation: "The maxillary sinus floor lies above the roots of upper premolars and molars — important for extractions and implants.",
    subject: "Anatomy",
  },
  {
    question: "Best test for diagnosing pulp vitality is:",
    options: ["Percussion", "Mobility test", "Thermal test", "Radiograph"],
    correctIndex: 2,
    explanation: "Thermal tests (cold/heat) and electric pulp tests assess pulp nerve response. Radiographs show structure, not vitality.",
    subject: "Endodontics",
  },
  {
    question: "Local anesthetic of choice in pregnancy is:",
    options: ["Lidocaine 2%", "Bupivacaine", "Articaine 4%", "Mepivacaine 3%"],
    correctIndex: 0,
    explanation: "Lidocaine is category B and considered safest. Use with caution; avoid epinephrine overdose.",
    subject: "Pharmacology",
  },
  {
    question: "First permanent tooth to erupt is usually:",
    options: ["Upper central incisor", "Lower central incisor", "First molar", "Lower first molar"],
    correctIndex: 3,
    explanation: "Lower first molar typically erupts around 6 years of age, often before any incisor exchange.",
    subject: "Pediatric Dentistry",
  },
  {
    question: "Class II div 1 malocclusion is characterized by:",
    options: [
      "Lower molar mesial to upper",
      "Proclined upper incisors with increased overjet",
      "Retroclined upper incisors with deep bite",
      "Anterior crossbite",
    ],
    correctIndex: 1,
    explanation: "Angle's Class II div 1: distal occlusion + proclined upper centrals + increased overjet.",
    subject: "Orthodontics",
  },
  {
    question: "Plaque is primarily composed of:",
    options: ["Food debris", "Bacterial biofilm", "Calcified material", "Salivary mucin only"],
    correctIndex: 1,
    explanation: "Dental plaque is a structured bacterial biofilm in a polysaccharide matrix. Calcified plaque becomes calculus.",
    subject: "Periodontics",
  },
  {
    question: "Most common cause of pulpitis is:",
    options: ["Trauma", "Caries", "Cracked tooth", "Periodontal disease"],
    correctIndex: 1,
    explanation: "Deep caries leading to bacterial invasion is by far the most common cause of pulpal inflammation.",
    subject: "Endodontics",
  },
  {
    question: "Resin composite is light-cured using which wavelength?",
    options: ["~350 nm", "~470 nm (blue light)", "~600 nm", "~250 nm (UV)"],
    correctIndex: 1,
    explanation: "Camphorquinone photoinitiator absorbs blue light around 470 nm. Modern LED units output this range.",
    subject: "Operative",
  },
];

function hashDate(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getTodayChallenge(): { date: string; questions: ChallengeMCQ[] } {
  const date = new Date().toISOString().split("T")[0];
  const seed = hashDate(date);
  // Pick 5 questions deterministically based on date
  const indices: number[] = [];
  let i = seed;
  while (indices.length < 5) {
    i = (i * 9301 + 49297) % 233280;
    const idx = i % POOL.length;
    if (!indices.includes(idx)) indices.push(idx);
  }
  return { date, questions: indices.map((idx) => POOL[idx]) };
}

const COMPLETION_KEY = "dentai-daily-challenge";

export interface ChallengeResult {
  date: string;
  score: number;
  total: number;
  completedAt: string;
}

export function getChallengeResult(date: string): ChallengeResult | null {
  try {
    const raw = localStorage.getItem(COMPLETION_KEY);
    if (!raw) return null;
    const all: ChallengeResult[] = JSON.parse(raw);
    return all.find((r) => r.date === date) ?? null;
  } catch {
    return null;
  }
}

export function saveChallengeResult(result: ChallengeResult) {
  try {
    const raw = localStorage.getItem(COMPLETION_KEY);
    const all: ChallengeResult[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((r) => r.date !== result.date);
    filtered.push(result);
    if (filtered.length > 30) filtered.splice(0, filtered.length - 30);
    localStorage.setItem(COMPLETION_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function getChallengeStreak(): number {
  try {
    const raw = localStorage.getItem(COMPLETION_KEY);
    if (!raw) return 0;
    const all: ChallengeResult[] = JSON.parse(raw);
    const dates = new Set(all.map((r) => r.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      if (dates.has(ds)) streak++;
      else if (i > 0) break;
    }
    return streak;
  } catch {
    return 0;
  }
}
