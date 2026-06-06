export interface TestMark {
  id: string;
  subjectId: string;
  testName: string;
  testType: "internal" | "viva" | "practical" | "other";
  marksObtained: number;
  totalMarks: number;
  facultyName: string;
  date: string;
  remarks: string;
  createdAt: string;
}

const STORAGE_KEY = "dentai-test-marks";
import { syncToCloud } from "./syncEngine";

export function getTestMarks(): TestMark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addTestMark(mark: Omit<TestMark, "id" | "createdAt">): TestMark {
  const marks = getTestMarks();
  const newMark: TestMark = {
    ...mark,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  marks.push(newMark);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  syncToCloud("test_marks", () => marks);
  return newMark;
}

export function deleteTestMark(id: string) {
  const marks = getTestMarks().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  syncToCloud("test_marks", () => marks);
}

export function getSubjectAverage(subjectId: string): number {
  const marks = getTestMarks().filter((m) => m.subjectId === subjectId);
  if (marks.length === 0) return 0;
  const totalPct = marks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0);
  return Math.round(totalPct / marks.length);
}
