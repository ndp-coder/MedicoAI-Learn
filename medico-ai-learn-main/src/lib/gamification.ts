const STORAGE_KEY = "dentai-gamification";
import { syncToCloud } from "./syncEngine";

export interface GamificationData {
  totalXP: number;
  dailyXP: number;
  dailyXPDate: string;
  dailyXPGoal: number;
  history: { date: string; xp: number }[];
}

export interface Level {
  name: string;
  emoji: string;
  minXP: number;
}

export const LEVELS: Level[] = [
  { name: "Medical Fresher", emoji: "🩺", minXP: 0 },
  { name: "Pre-Clinical", emoji: "📖", minXP: 500 },
  { name: "Clinical Intern", emoji: "🔬", minXP: 1500 },
  { name: "Resident", emoji: "🩺", minXP: 3500 },
  { name: "Specialist", emoji: "⭐", minXP: 7000 },
  { name: "Professor", emoji: "🎓", minXP: 15000 },
];

export const XP_REWARDS = {
  quiz: 50,
  viva: 100,
  flashcard: 10,
  pomodoro: 25,
  recap: 30,
  drill: 60,
  caseStudy: 80,
  diagramQuiz: 70,
  note: 15,
  mockExam: 150,
  streak_bonus: 20,
} as const;

function getData(): GamificationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { totalXP: 0, dailyXP: 0, dailyXPDate: "", dailyXPGoal: 200, history: [] };
    const data = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (data.dailyXPDate !== today) {
      data.dailyXP = 0;
      data.dailyXPDate = today;
    }
    return data;
  } catch {
    return { totalXP: 0, dailyXP: 0, dailyXPDate: "", dailyXPGoal: 200, history: [] };
  }
}

function saveData(data: GamificationData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  syncToCloud("gamification", () => data);
}

export function getXPData(): GamificationData {
  return getData();
}

export function getCurrentLevel(): Level {
  const { totalXP } = getData();
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (totalXP >= l.minXP) level = l;
  }
  return level;
}

export function getNextLevel(): Level | null {
  const { totalXP } = getData();
  for (const l of LEVELS) {
    if (totalXP < l.minXP) return l;
  }
  return null;
}

export function getLevelProgress(): number {
  const { totalXP } = getData();
  const current = getCurrentLevel();
  const next = getNextLevel();
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const progress = totalXP - current.minXP;
  return Math.min(100, Math.round((progress / range) * 100));
}

export function awardXP(activity: keyof typeof XP_REWARDS, multiplier = 1): { xp: number; leveledUp: boolean; newLevel?: Level } {
  const data = getData();
  const today = new Date().toISOString().split("T")[0];
  const xp = Math.round(XP_REWARDS[activity] * multiplier);
  
  const oldLevel = getCurrentLevel();
  
  data.totalXP += xp;
  if (data.dailyXPDate !== today) {
    data.dailyXP = 0;
    data.dailyXPDate = today;
  }
  data.dailyXP += xp;
  
  const existing = data.history.find(h => h.date === today);
  if (existing) {
    existing.xp += xp;
  } else {
    data.history.push({ date: today, xp });
    if (data.history.length > 30) data.history = data.history.slice(-30);
  }
  
  saveData(data);
  
  const newLevel = getCurrentLevel();
  const leveledUp = newLevel.minXP > oldLevel.minXP;
  
  return { xp, leveledUp, newLevel: leveledUp ? newLevel : undefined };
}

export function getXPHistory(): { date: string; xp: number }[] {
  return getData().history;
}
