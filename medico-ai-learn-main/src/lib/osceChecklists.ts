export interface OSCEStep {
  id: string;
  text: string;
  critical?: boolean;
}

export interface OSCEChecklist {
  id: string;
  title: string;
  emoji: string;
  category: string;
  estMinutes: number;
  description: string;
  steps: OSCEStep[];
}

export const OSCE_CHECKLISTS: OSCEChecklist[] = [
  {
    id: "local-anesthesia",
    title: "Inferior Alveolar Nerve Block",
    emoji: "💉",
    category: "Anesthesia",
    estMinutes: 5,
    description: "Standard IANB technique for mandibular anesthesia.",
    steps: [
      { id: "1", text: "Introduce self, confirm patient identity & consent", critical: true },
      { id: "2", text: "Verify medical history, allergies (esp. amide LA)", critical: true },
      { id: "3", text: "Position patient supine, mouth wide open" },
      { id: "4", text: "Identify landmarks: coronoid notch, pterygomandibular raphe" },
      { id: "5", text: "Apply topical anesthetic at injection site (1 min)" },
      { id: "6", text: "Place thumb in coronoid notch, finger on posterior ramus" },
      { id: "7", text: "Syringe approached from opposite premolars, 6–10 mm above occlusal plane" },
      { id: "8", text: "Advance needle until bone contact (~20–25 mm)" },
      { id: "9", text: "Withdraw 1 mm, aspirate (negative)", critical: true },
      { id: "10", text: "Slowly deposit 1.5 mL over 60 seconds" },
      { id: "11", text: "Withdraw needle, recap safely, wait 3–5 min for onset" },
      { id: "12", text: "Confirm anesthesia (lip + tongue numbness)" },
    ],
  },
  {
    id: "scaling",
    title: "Supragingival Scaling",
    emoji: "🪥",
    category: "Periodontics",
    estMinutes: 15,
    description: "Manual + ultrasonic scaling of a single quadrant.",
    steps: [
      { id: "1", text: "PPE: gloves, mask, eyewear, gown", critical: true },
      { id: "2", text: "Patient draped, suction & water syringe ready" },
      { id: "3", text: "Perform full periodontal examination (BOP, PD)" },
      { id: "4", text: "Use ultrasonic scaler at low–medium power" },
      { id: "5", text: "Light pen grasp, finger rest on adjacent tooth", critical: true },
      { id: "6", text: "Sweep tip parallel to long axis of tooth, avoid prolonged contact" },
      { id: "7", text: "Use Gracey/universal currette for residual deposits" },
      { id: "8", text: "Sharp scaler with correct angulation (45–90°)" },
      { id: "9", text: "Check with explorer for smooth surface", critical: true },
      { id: "10", text: "Polish with prophy paste & rubber cup" },
      { id: "11", text: "Rinse, provide oral hygiene instructions" },
    ],
  },
  {
    id: "extraction",
    title: "Simple Tooth Extraction",
    emoji: "🦷",
    category: "Oral Surgery",
    estMinutes: 20,
    description: "Forceps extraction of a non-impacted tooth.",
    steps: [
      { id: "1", text: "Confirm tooth, side, indication, consent", critical: true },
      { id: "2", text: "Review radiograph for root morphology" },
      { id: "3", text: "Achieve profound local anesthesia", critical: true },
      { id: "4", text: "Sever supracrestal fibers with periotome/elevator" },
      { id: "5", text: "Luxate tooth with straight elevator" },
      { id: "6", text: "Apply forceps apically to bony attachment" },
      { id: "7", text: "Apply controlled buccal–lingual + rotational forces" },
      { id: "8", text: "Deliver tooth with traction in path of least resistance" },
      { id: "9", text: "Inspect socket for fragments, granulation tissue", critical: true },
      { id: "10", text: "Irrigate socket with saline" },
      { id: "11", text: "Achieve hemostasis with gauze pressure (10 min)" },
      { id: "12", text: "Give post-op instructions (cold pack, analgesics, no spitting)" },
    ],
  },
  {
    id: "amalgam-restoration",
    title: "Class II Amalgam Restoration",
    emoji: "⚙️",
    category: "Operative",
    estMinutes: 25,
    description: "Standard Class II amalgam preparation and placement.",
    steps: [
      { id: "1", text: "LA achieved, rubber dam isolation" },
      { id: "2", text: "Outline form: occlusal + proximal box", critical: true },
      { id: "3", text: "Resistance form: flat pulpal floor, 1.5–2 mm depth" },
      { id: "4", text: "Retention form: occlusal convergence, proximal grooves" },
      { id: "5", text: "Remove all caries (carious dentin removal)", critical: true },
      { id: "6", text: "Place matrix band + wedge", critical: true },
      { id: "7", text: "Triturate amalgam, condense in increments" },
      { id: "8", text: "Carve occlusal anatomy before set" },
      { id: "9", text: "Remove matrix, check proximal contact" },
      { id: "10", text: "Check occlusion with articulating paper", critical: true },
      { id: "11", text: "Final smoothing & burnish" },
    ],
  },
  {
    id: "hand-hygiene",
    title: "Surgical Hand Wash",
    emoji: "🧼",
    category: "Infection Control",
    estMinutes: 3,
    description: "Pre-surgical hand asepsis technique.",
    steps: [
      { id: "1", text: "Remove all jewelry, watch", critical: true },
      { id: "2", text: "Open sterile brush + wear mask first" },
      { id: "3", text: "Wet hands & forearms with running water" },
      { id: "4", text: "Apply antiseptic (chlorhexidine/povidone)" },
      { id: "5", text: "Wash fingers, web spaces, palms, backs (1 min)" },
      { id: "6", text: "Brush nails for 30 seconds" },
      { id: "7", text: "Wash up to elbow, keeping hands above elbow", critical: true },
      { id: "8", text: "Rinse thoroughly, hands above elbows" },
      { id: "9", text: "Dry with sterile towel: hands → forearm" },
      { id: "10", text: "Don sterile gown & gloves without contamination" },
    ],
  },
];

export function getChecklistById(id: string): OSCEChecklist | undefined {
  return OSCE_CHECKLISTS.find((c) => c.id === id);
}
