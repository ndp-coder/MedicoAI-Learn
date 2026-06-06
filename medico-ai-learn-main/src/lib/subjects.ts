import { Heart, Brain, FlaskConical, CircleDot, Scan, Microscope, Baby, Bone, Shield, Bug, Pill, Gem, Wrench, Crown, Stethoscope, Swords, Skull, BugOff, Scissors, Smile, Activity, Radiation, Syringe, BookOpen, Scale, Users, Cross, HeartPulse, Eye, Ear, Sparkles, ShieldPlus, Droplet, Sun, Wind } from "lucide-react";

export type Course = "mbbs" | "bds";

export interface Subject {
  id: string;
  name: string;
  book: string;
  author: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
  year: 1 | 2 | 3 | 4;
  course: Course;
}

/**
 * BDS subjects (DCI BDS Course Regulations 2007, kept verbatim from prior
 * version so existing user data keeps resolving by id).
 */
const BDS_SUBJECTS: Subject[] = [
  // ─── Year 1 ───
  { id: "physiology",            name: "Physiology",                       book: "Inderbir Singh's Physiology",                            author: "Inderbir Singh",                 icon: Heart,        color: "text-rose-600",    bgColor: "bg-rose-50",    year: 1, course: "bds" },
  { id: "anatomy-head-neck",     name: "Anatomy (Head & Neck)",            book: "Vishram Singh's Anatomy",                                author: "Vishram Singh",                  icon: Brain,        color: "text-blue-600",    bgColor: "bg-blue-50",    year: 1, course: "bds" },
  { id: "biochemistry",          name: "Biochemistry",                     book: "U. Satyanarayana's Biochemistry",                        author: "U. Satyanarayana",               icon: FlaskConical, color: "text-emerald-600", bgColor: "bg-emerald-50", year: 1, course: "bds" },
  { id: "dental-occlusion",      name: "Dental Occlusion",                 book: "Wheeler's Dental Occlusion",                             author: "Wheeler's",                      icon: CircleDot,    color: "text-amber-600",   bgColor: "bg-amber-50",   year: 1, course: "bds" },
  { id: "dental-anatomy",        name: "Dental Anatomy",                   book: "Wheeler's Dental Anatomy",                               author: "Wheeler's",                      icon: Scan,         color: "text-purple-600",  bgColor: "bg-purple-50",  year: 1, course: "bds" },
  { id: "oral-histology",        name: "Oral Histology & Embryology",      book: "Orban's Oral Histology & Embryology",                    author: "Orban's",                        icon: Microscope,   color: "text-teal-600",    bgColor: "bg-teal-50",    year: 1, course: "bds" },
  { id: "human-histology",       name: "Human Histology",                  book: "Inderbir Singh's Human Histology",                       author: "Inderbir Singh",                 icon: Bone,         color: "text-orange-600",  bgColor: "bg-orange-50",  year: 1, course: "bds" },
  { id: "human-embryology",      name: "Human Embryology",                 book: "Inderbir Singh's Human Embryology",                      author: "Inderbir Singh",                 icon: Baby,         color: "text-pink-600",    bgColor: "bg-pink-50",    year: 1, course: "bds" },

  // ─── Year 2 ───
  { id: "general-pathology",     name: "General Pathology",                book: "Textbook of Pathology",                                  author: "Harsh Mohan",                    icon: Shield,       color: "text-red-600",     bgColor: "bg-red-50",     year: 2, course: "bds" },
  { id: "microbiology",          name: "Microbiology",                     book: "Textbook of Microbiology",                               author: "Ananthanarayan & Paniker",       icon: Bug,          color: "text-green-600",   bgColor: "bg-green-50",   year: 2, course: "bds" },
  { id: "pharmacology",          name: "General & Dental Pharmacology",    book: "Essentials of Medical Pharmacology",                     author: "K. D. Tripathi",                 icon: Pill,         color: "text-indigo-600",  bgColor: "bg-indigo-50",  year: 2, course: "bds" },
  { id: "dental-materials",      name: "Dental Materials",                 book: "Phillips' Science of Dental Materials",                  author: "Kenneth J. Anusavice",           icon: Gem,          color: "text-cyan-600",    bgColor: "bg-cyan-50",    year: 2, course: "bds" },
  { id: "dental-materials-alt",  name: "Basic Dental Materials",           book: "Basic Dental Materials",                                 author: "John J. Manappallil",            icon: Wrench,       color: "text-slate-600",   bgColor: "bg-slate-50",   year: 2, course: "bds" },
  { id: "preclinical-conservative",    name: "Pre-Clinical Conservative Dentistry", book: "Preclinical Manual of Conservative Dentistry", author: "V. Gopikrishna",                 icon: Crown,        color: "text-yellow-600",  bgColor: "bg-yellow-50",  year: 2, course: "bds" },
  { id: "preclinical-prosthodontics",  name: "Pre-Clinical Prosthodontics",         book: "Essentials of Complete Denture Prosthodontics", author: "Boucher",                        icon: Smile,        color: "text-violet-600",  bgColor: "bg-violet-50",  year: 2, course: "bds" },

  // ─── Year 3 ───
  { id: "general-medicine",      name: "General Medicine",                 book: "Davidson's Principles and Practice of Medicine",         author: "Brian R. Walker",                icon: Stethoscope,  color: "text-blue-700",    bgColor: "bg-blue-50",    year: 3, course: "bds" },
  { id: "general-surgery",       name: "General Surgery",                  book: "Manipal Manual of Surgery",                              author: "K. Rajgopal Shenoy",             icon: Swords,       color: "text-red-700",     bgColor: "bg-red-50",     year: 3, course: "bds" },
  { id: "oral-pathology",        name: "Oral Pathology",                   book: "Shafer's Textbook of Oral Pathology",                    author: "Rajendran & Sivapathasundharam", icon: Skull,        color: "text-orange-700",  bgColor: "bg-orange-50",  year: 3, course: "bds" },
  { id: "oral-microbiology",     name: "Oral Microbiology",                book: "Essential Microbiology for Dentistry",                   author: "Lakshman Samaranayake",          icon: BugOff,       color: "text-lime-600",    bgColor: "bg-lime-50",    year: 3, course: "bds" },
  { id: "conservative-endodontics", name: "Conservative Dentistry & Endodontics", book: "Textbook of Operative Dentistry",                 author: "Nisha Garg",                     icon: Scissors,     color: "text-amber-700",   bgColor: "bg-amber-50",   year: 3, course: "bds" },
  { id: "orthodontics",          name: "Orthodontics & Dentofacial Orthopedics", book: "Contemporary Orthodontics",                       author: "William R. Proffit",             icon: Activity,     color: "text-purple-700",  bgColor: "bg-purple-50",  year: 3, course: "bds" },
  { id: "pediatric-dentistry",   name: "Pediatric & Preventive Dentistry", book: "Textbook of Pediatric Dentistry",                        author: "Shobha Tandon",                  icon: Baby,         color: "text-pink-700",    bgColor: "bg-pink-50",    year: 3, course: "bds" },
  { id: "oral-medicine-radiology", name: "Oral Medicine & Radiology",      book: "Textbook of Oral Medicine, Oral Diagnosis and Oral Radiology", author: "N. G. R. Chandra",          icon: Radiation,    color: "text-teal-700",    bgColor: "bg-teal-50",    year: 3, course: "bds" },

  // ─── Year 4 ───
  { id: "maxillofacial-surgery", name: "Oral & Maxillofacial Surgery",     book: "Textbook of Oral and Maxillofacial Surgery",             author: "Neelima Malik",                  icon: Syringe,      color: "text-red-800",     bgColor: "bg-red-50",     year: 4, course: "bds" },
  { id: "prosthodontics-crown-bridge", name: "Prosthodontics & Crown and Bridge", book: "Textbook of Prosthodontics",                       author: "Vimal K. Sikri",                 icon: Crown,        color: "text-amber-800",   bgColor: "bg-amber-50",   year: 4, course: "bds" },
  { id: "conservative-endodontics-4", name: "Conservative Dentistry & Endodontics", book: "Textbook of Operative Dentistry",               author: "Nisha Garg",                     icon: Scissors,     color: "text-yellow-700",  bgColor: "bg-yellow-50",  year: 4, course: "bds" },
  { id: "orthodontics-4",        name: "Orthodontics & Dentofacial Orthopedics", book: "Orthodontics: The Art and Science",                author: "S. I. Bhalajhi",                 icon: Activity,     color: "text-violet-700",  bgColor: "bg-violet-50",  year: 4, course: "bds" },
  { id: "periodontology",        name: "Periodontology",                   book: "Textbook of Periodontology",                             author: "Carranza",                       icon: HeartPulse,   color: "text-rose-700",    bgColor: "bg-rose-50",    year: 4, course: "bds" },
  { id: "oral-medicine-radiology-4", name: "Oral Medicine & Radiology",    book: "Essentials of Oral Medicine and Radiology",              author: "K. K. Singh",                    icon: Radiation,    color: "text-cyan-700",    bgColor: "bg-cyan-50",    year: 4, course: "bds" },
  { id: "pediatric-dentistry-4", name: "Pediatric & Preventive Dentistry", book: "Textbook of Pediatric Dentistry",                        author: "Shobha Tandon",                  icon: Baby,         color: "text-pink-800",    bgColor: "bg-pink-50",    year: 4, course: "bds" },
  { id: "public-health-dentistry", name: "Public Health Dentistry",        book: "Textbook of Public Health Dentistry",                    author: "Soben Peter",                    icon: Users,        color: "text-green-700",   bgColor: "bg-green-50",   year: 4, course: "bds" },
  { id: "oral-surgery",          name: "Oral Surgery",                     book: "Textbook of Oral and Maxillofacial Surgery",             author: "Neelima Malik",                  icon: Cross,        color: "text-slate-700",   bgColor: "bg-slate-50",   year: 4, course: "bds" },
];

/**
 * MBBS subjects — NMC CBME Curriculum (Phase I–III). Years 3 & 4 condensed
 * into our 4-year buckets for UI consistency; "Final" = year 4.
 */
const MBBS_SUBJECTS: Subject[] = [
  // ─── Year 1 (Phase I — Pre-Clinical) ───
  { id: "mbbs-anatomy",          name: "Anatomy",                          book: "BD Chaurasia's Human Anatomy",                           author: "B. D. Chaurasia",                icon: Brain,        color: "text-blue-600",    bgColor: "bg-blue-50",    year: 1, course: "mbbs" },
  { id: "mbbs-physiology",       name: "Physiology",                       book: "Textbook of Medical Physiology",                          author: "Guyton & Hall",                 icon: HeartPulse,   color: "text-rose-600",    bgColor: "bg-rose-50",    year: 1, course: "mbbs" },
  { id: "mbbs-biochemistry",     name: "Biochemistry",                     book: "Textbook of Biochemistry for Medical Students",          author: "DM Vasudevan",                   icon: FlaskConical, color: "text-emerald-600", bgColor: "bg-emerald-50", year: 1, course: "mbbs" },
  { id: "mbbs-foundation",       name: "Foundation Course & AETCOM",       book: "AETCOM Module — NMC",                                    author: "NMC",                            icon: BookOpen,     color: "text-amber-600",   bgColor: "bg-amber-50",   year: 1, course: "mbbs" },
  { id: "mbbs-community-1",      name: "Community Medicine I",             book: "Park's Textbook of PSM",                                 author: "K. Park",                        icon: Users,        color: "text-green-600",   bgColor: "bg-green-50",   year: 1, course: "mbbs" },

  // ─── Year 2 (Phase II — Para-Clinical) ───
  { id: "mbbs-pathology",        name: "Pathology",                        book: "Textbook of Pathology",                                  author: "Harsh Mohan",                    icon: Shield,       color: "text-red-600",     bgColor: "bg-red-50",     year: 2, course: "mbbs" },
  { id: "mbbs-pharmacology",     name: "Pharmacology",                     book: "Essentials of Medical Pharmacology",                     author: "K. D. Tripathi",                 icon: Pill,         color: "text-indigo-600",  bgColor: "bg-indigo-50",  year: 2, course: "mbbs" },
  { id: "mbbs-microbiology",     name: "Microbiology",                     book: "Textbook of Microbiology",                               author: "Ananthanarayan & Paniker",       icon: Bug,          color: "text-green-600",   bgColor: "bg-green-50",   year: 2, course: "mbbs" },
  { id: "mbbs-forensic",         name: "Forensic Medicine & Toxicology",   book: "Textbook of Forensic Medicine and Toxicology",           author: "Krishan Vij",                    icon: Scale,        color: "text-slate-600",   bgColor: "bg-slate-50",   year: 2, course: "mbbs" },
  { id: "mbbs-community-2",      name: "Community Medicine II",            book: "Park's Textbook of PSM",                                 author: "K. Park",                        icon: Users,        color: "text-green-700",   bgColor: "bg-green-50",   year: 2, course: "mbbs" },
  { id: "mbbs-clinical-intro",   name: "Introduction to Clinical Subjects",book: "Macleod's Clinical Examination",                          author: "Anna Innes",                     icon: Stethoscope,  color: "text-teal-600",    bgColor: "bg-teal-50",    year: 2, course: "mbbs" },

  // ─── Year 3 (Phase III Part 1) ───
  { id: "mbbs-ent",              name: "ENT (Otorhinolaryngology)",        book: "Diseases of Ear, Nose and Throat",                       author: "P. L. Dhingra",                  icon: Ear,          color: "text-purple-600",  bgColor: "bg-purple-50",  year: 3, course: "mbbs" },
  { id: "mbbs-ophthalmology",    name: "Ophthalmology",                    book: "Comprehensive Ophthalmology",                            author: "A. K. Khurana",                  icon: Eye,          color: "text-cyan-600",    bgColor: "bg-cyan-50",    year: 3, course: "mbbs" },
  { id: "mbbs-community-3",      name: "Community Medicine III",           book: "Park's Textbook of PSM",                                 author: "K. Park",                        icon: Users,        color: "text-green-800",   bgColor: "bg-green-50",   year: 3, course: "mbbs" },
  { id: "mbbs-medicine-jr",      name: "General Medicine (Clinical Posting)", book: "API Textbook of Medicine",                            author: "API",                            icon: Stethoscope,  color: "text-blue-700",    bgColor: "bg-blue-50",    year: 3, course: "mbbs" },
  { id: "mbbs-surgery-jr",       name: "General Surgery (Clinical Posting)",   book: "SRB's Manual of Surgery",                             author: "Sriram Bhat M.",                 icon: Swords,       color: "text-red-700",     bgColor: "bg-red-50",     year: 3, course: "mbbs" },

  // ─── Year 4 (Phase III Part 2 / Final) ───
  { id: "mbbs-medicine",         name: "General Medicine",                 book: "Davidson's Principles and Practice of Medicine",         author: "Brian R. Walker",                icon: Stethoscope,  color: "text-blue-800",    bgColor: "bg-blue-50",    year: 4, course: "mbbs" },
  { id: "mbbs-surgery",          name: "General Surgery",                  book: "Bailey & Love's Short Practice of Surgery",              author: "Norman S. Williams",             icon: Swords,       color: "text-red-800",     bgColor: "bg-red-50",     year: 4, course: "mbbs" },
  { id: "mbbs-obg",              name: "Obstetrics & Gynaecology",         book: "Textbook of Obstetrics / Gynaecology",                   author: "D. C. Dutta",                    icon: Baby,         color: "text-pink-700",    bgColor: "bg-pink-50",    year: 4, course: "mbbs" },
  { id: "mbbs-paediatrics",      name: "Paediatrics",                      book: "Essential Pediatrics",                                   author: "O. P. Ghai",                     icon: Baby,         color: "text-pink-600",    bgColor: "bg-pink-50",    year: 4, course: "mbbs" },
  { id: "mbbs-orthopaedics",     name: "Orthopaedics",                     book: "Essential Orthopaedics",                                 author: "J. Maheshwari",                  icon: Bone,         color: "text-orange-700",  bgColor: "bg-orange-50",  year: 4, course: "mbbs" },
  { id: "mbbs-anaesthesia",      name: "Anaesthesiology",                  book: "Understanding Anesthesia",                               author: "Sunil T. Pandya",                icon: Wind,         color: "text-sky-600",     bgColor: "bg-sky-50",     year: 4, course: "mbbs" },
  { id: "mbbs-radiology",        name: "Radiology",                        book: "Textbook of Radiology and Imaging",                      author: "David Sutton",                   icon: Radiation,    color: "text-teal-700",    bgColor: "bg-teal-50",    year: 4, course: "mbbs" },
  { id: "mbbs-dermatology",      name: "Dermatology, Venereology & Leprosy", book: "IADVL Textbook of Dermatology",                         author: "IADVL",                          icon: Sun,          color: "text-yellow-700",  bgColor: "bg-yellow-50",  year: 4, course: "mbbs" },
  { id: "mbbs-psychiatry",       name: "Psychiatry",                       book: "Shorter Oxford Textbook of Psychiatry",                  author: "Cowen, Harrison & Burns",        icon: Brain,        color: "text-violet-700",  bgColor: "bg-violet-50",  year: 4, course: "mbbs" },
  { id: "mbbs-emergency",        name: "Emergency Medicine",               book: "Tintinalli's Emergency Medicine",                         author: "Judith E. Tintinalli",          icon: ShieldPlus,   color: "text-rose-700",    bgColor: "bg-rose-50",    year: 4, course: "mbbs" },
];

export const subjectsByCourse: Record<Course, Subject[]> = {
  bds: BDS_SUBJECTS,
  mbbs: MBBS_SUBJECTS,
};

/** Union of every subject across every course (used for id lookups so old data still resolves). */
export const allSubjects: Subject[] = [...BDS_SUBJECTS, ...MBBS_SUBJECTS];

export function getSubjectsForCourse(course: Course): Subject[] {
  return subjectsByCourse[course] ?? [];
}

export function getSubjectsByYear(year: number, course?: Course): Subject[] {
  const pool = course ? getSubjectsForCourse(course) : allSubjects;
  return pool.filter(s => s.year === year);
}

export function getYearNumber(yearString: string): number {
  if (!yearString) return 1;
  const lower = yearString.toLowerCase();
  if (lower.includes("final") || lower.includes("intern")) return 4;
  const match = yearString.match(/(\d)/);
  return match ? parseInt(match[1]) : 1;
}

const COURSE_KEY = "medicoai-course";
const YEAR_KEY = "dentai-year"; // kept for backward compatibility
const SELECTED_SUBJECTS_KEY = "medicoai-selected-subjects";

export function getCurrentCourse(): Course {
  try {
    const raw = localStorage.getItem(COURSE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed === "mbbs" || parsed === "bds") return parsed;
    }
  } catch {}
  return "bds";
}

export function setCurrentCourse(course: Course) {
  localStorage.setItem(COURSE_KEY, JSON.stringify(course));
}

export function hasCompletedOnboarding(): boolean {
  try {
    return !!localStorage.getItem(COURSE_KEY);
  } catch {
    return false;
  }
}

export function getSelectedSubjectIds(): string[] {
  try {
    const raw = localStorage.getItem(SELECTED_SUBJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(x => typeof x === "string");
    }
  } catch {}
  return [];
}

export function setSelectedSubjectIds(ids: string[]) {
  localStorage.setItem(SELECTED_SUBJECTS_KEY, JSON.stringify(ids));
}

/** Subjects available to the current user (course + year filtered, then narrowed by selection if any). */
export function getActiveSubjects(): Subject[] {
  const course = getCurrentCourse();
  let pool = getSubjectsForCourse(course);
  try {
    const yearStr = localStorage.getItem(YEAR_KEY);
    if (yearStr) {
      const yearNum = getYearNumber(JSON.parse(yearStr));
      pool = pool.filter(s => s.year === yearNum);
    }
  } catch {}
  const selected = getSelectedSubjectIds();
  if (selected.length > 0) {
    const filtered = pool.filter(s => selected.includes(s.id));
    if (filtered.length > 0) return filtered;
  }
  return pool;
}

/** Backward-compatible default: subjects for current course + year. */
export const subjects = getActiveSubjects();

export function getUserSubjectsFromStorage(): Subject[] {
  return getActiveSubjects();
}

export function courseLabel(course: Course): string {
  return course === "mbbs" ? "MBBS" : "BDS";
}

export function buildSystemPrompt(yearSubjects: Subject[]): string {
  const course = yearSubjects[0]?.course ?? getCurrentCourse();
  const discipline = course === "mbbs" ? "medical (MBBS)" : "dental (BDS)";
  const bookList = yearSubjects.map(s => `${s.book} by ${s.author}`).join(", ");
  return `You are MedicoAI, an expert ${discipline} education assistant trained on the following textbooks: ${bookList}. Always answer questions in the context of ${discipline} studies. When your answer is based on these books, mention the specific book. When the information is from general medical knowledge, clearly state that. Keep explanations clear, structured, and student-friendly.

IMPORTANT: At the end of every response, on a new line, add a source tag in this exact format:
- If the answer is based on a specific textbook: 📖 Source: [Book Name]
- If from general knowledge: 🧠 Source: General Knowledge
- If from multiple books: 📖 Sources: [Book 1], [Book 2]`;
}

export const DENTAL_SYSTEM_PROMPT = buildSystemPrompt(getActiveSubjects());

export const motivationalQuotes = [
  "The best time to study was yesterday. The next best time is now.",
  "Wherever the art of medicine is loved, there is also a love of humanity. — Hippocrates",
  "Success in medical school comes from consistent daily effort, not cramming.",
  "A good clinician never stops learning. Start building that habit today.",
  "The expert in anything was once a beginner. Keep going!",
  "Your knowledge today shapes the lives you'll save tomorrow.",
  "Study like there's no tomorrow, practice like you'll never stop learning.",
  "Medicine is a science of uncertainty and an art of probability. — William Osler",
];
