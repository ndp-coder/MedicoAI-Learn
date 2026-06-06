export interface SubjectProgress {
  questionsAttempted: number;
  questionsCorrect: number;
  topicsReviewed: string[];
}

export type ProgressData = Record<string, SubjectProgress>;

const STORAGE_KEY = "dentai-subject-progress";
import { syncToCloud } from "./syncEngine";

export function getProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(data: ProgressData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  syncToCloud("progress", () => data);
}

export function trackQuizAttempt(subjectId: string, attempted: number, correct: number) {
  const data = getProgress();
  if (!data[subjectId]) {
    data[subjectId] = { questionsAttempted: 0, questionsCorrect: 0, topicsReviewed: [] };
  }
  data[subjectId].questionsAttempted += attempted;
  data[subjectId].questionsCorrect += correct;
  saveProgress(data);
}

export function trackTopicReview(subjectId: string, topic: string) {
  const data = getProgress();
  if (!data[subjectId]) {
    data[subjectId] = { questionsAttempted: 0, questionsCorrect: 0, topicsReviewed: [] };
  }
  if (!data[subjectId].topicsReviewed.includes(topic)) {
    data[subjectId].topicsReviewed.push(topic);
  }
  saveProgress(data);
}
