const STORAGE_KEY = "dentai-activity-log";
import { syncToCloud } from "./syncEngine";

export interface DayActivity {
  quiz: boolean;
  recap: boolean;
  flashcards: boolean;
}

export type ActivityLog = Record<string, DayActivity>;

export function getActivityLog(): ActivityLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function logActivity(type: "quiz" | "recap" | "flashcards") {
  const log = getActivityLog();
  const today = new Date().toISOString().split("T")[0];
  if (!log[today]) log[today] = { quiz: false, recap: false, flashcards: false };
  log[today][type] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  syncToCloud("activity_log", () => log);
}

export function getCurrentStreak(): number {
  const log = getActivityLog();
  let streak = 0;
  const d = new Date();
  const todayKey = d.toISOString().split("T")[0];
  if (!log[todayKey]) {
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const key = d.toISOString().split("T")[0];
    const day = log[key];
    if (day && (day.quiz || day.recap || day.flashcards)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
