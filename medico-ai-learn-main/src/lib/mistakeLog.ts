const STORAGE_KEY = "dentai-mistake-log";
import { pushToCloud } from "./syncEngine";

export interface Mistake {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  userAnswer: number;
  explanation: string;
  subjectId: string;
  source: "quiz" | "drill" | "viva" | "pyq" | "mock";
  timestamp: string;
  timesWrong: number;
  timesCorrectAfter: number;
}

function getMistakes(): Mistake[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveMistakes(mistakes: Mistake[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
  pushToCloud(STORAGE_KEY, mistakes);
}

export function logMistake(data: Omit<Mistake, "id" | "timestamp" | "timesWrong" | "timesCorrectAfter">) {
  const mistakes = getMistakes();
  const existing = mistakes.find(m => m.question === data.question);
  if (existing) {
    existing.timesWrong += 1;
    existing.timestamp = new Date().toISOString();
  } else {
    mistakes.unshift({
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      timesWrong: 1,
      timesCorrectAfter: 0,
    });
  }
  saveMistakes(mistakes);
}

export function logCorrectRetry(questionText: string) {
  const mistakes = getMistakes();
  const m = mistakes.find(m => m.question === questionText);
  if (m) {
    m.timesCorrectAfter += 1;
    saveMistakes(mistakes);
  }
}

export function getAllMistakes(): Mistake[] {
  return getMistakes();
}

export function getMistakesBySubject(subjectId: string): Mistake[] {
  return getMistakes().filter(m => m.subjectId === subjectId);
}

export function getMistakeStats() {
  const mistakes = getMistakes();
  const bySubject: Record<string, number> = {};
  mistakes.forEach(m => {
    bySubject[m.subjectId] = (bySubject[m.subjectId] || 0) + 1;
  });
  const improved = mistakes.filter(m => m.timesCorrectAfter > 0).length;
  const persistent = mistakes.filter(m => m.timesWrong >= 3 && m.timesCorrectAfter === 0).length;
  return { total: mistakes.length, bySubject, improved, persistent };
}

export function clearMistakes() {
  localStorage.removeItem(STORAGE_KEY);
  pushToCloud(STORAGE_KEY, []);
}

export function getPracticeMistakes(subjectId?: string, limit = 10): Mistake[] {
  let mistakes = getMistakes();
  if (subjectId) mistakes = mistakes.filter(m => m.subjectId === subjectId);
  return mistakes
    .sort((a, b) => (b.timesWrong - b.timesCorrectAfter) - (a.timesWrong - a.timesCorrectAfter))
    .slice(0, limit);
}
