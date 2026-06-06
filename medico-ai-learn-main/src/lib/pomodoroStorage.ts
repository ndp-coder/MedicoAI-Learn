export interface PomodoroSession {
  date: string;
  completedAt: string;
  durationMinutes: number;
}

const STORAGE_KEY = "dentai-pomodoro-sessions";
import { syncToCloud } from "./syncEngine";

export function getPomodoroSessions(): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logPomodoroSession(durationMinutes: number) {
  const sessions = getPomodoroSessions();
  sessions.push({
    date: new Date().toISOString().split("T")[0],
    completedAt: new Date().toISOString(),
    durationMinutes,
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  syncToCloud("pomodoro", () => sessions);
}

export function getTodayPomodoroCount(): number {
  const today = new Date().toISOString().split("T")[0];
  return getPomodoroSessions().filter((s) => s.date === today).length;
}

export function getTodayPomodoroMinutes(): number {
  const today = new Date().toISOString().split("T")[0];
  return getPomodoroSessions()
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
}
