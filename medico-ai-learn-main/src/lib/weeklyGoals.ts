import { pushToCloud } from "./syncEngine";

export interface WeeklyGoals {
  targetQuizzes: number;
  targetRecaps: number;
  targetFlashcards: number;
  targetHours: number;
}

export interface WeeklyLog {
  date: string;
  hoursStudied: number;
}

export const DEFAULT_GOALS: WeeklyGoals = {
  targetQuizzes: 5,
  targetRecaps: 3,
  targetFlashcards: 10,
  targetHours: 10,
};

const LOG_KEY = "dentai-study-hours-log";

export function getStudyHoursLog(): WeeklyLog[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logStudyHours(hours: number) {
  const logs = getStudyHoursLog();
  const today = new Date().toISOString().split("T")[0];
  const existing = logs.find((l) => l.date === today);
  if (existing) {
    existing.hoursStudied += hours;
  } else {
    logs.push({ date: today, hoursStudied: hours });
  }
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  pushToCloud(LOG_KEY, logs);
}

export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export function getWeeklyHours(): number {
  const { start, end } = getWeekRange();
  const logs = getStudyHoursLog();
  return logs
    .filter((l) => l.date >= start && l.date <= end)
    .reduce((sum, l) => sum + l.hoursStudied, 0);
}

export function getWeeklyActivityCounts(): { quizzes: number; recaps: number; flashcards: number } {
  const { start, end } = getWeekRange();
  const activityLog = JSON.parse(localStorage.getItem("dentai-activity-log") || "{}");
  let quizzes = 0, recaps = 0, flashcards = 0;
  for (const [date, activity] of Object.entries(activityLog) as [string, any][]) {
    if (date >= start && date <= end) {
      if (activity.quiz) quizzes++;
      if (activity.recap) recaps++;
      if (activity.flashcards) flashcards++;
    }
  }
  return { quizzes, recaps, flashcards };
}
