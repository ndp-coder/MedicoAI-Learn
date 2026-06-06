import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  getSubjectsForCourse,
  getYearNumber,
  type Course,
  type Subject,
} from "@/lib/subjects";

export function useUserSubjects(): Subject[] {
  const [yearStr] = useLocalStorage("dentai-year", "");
  const [course] = useLocalStorage<Course>("medicoai-course", "bds");
  const [selectedIds] = useLocalStorage<string[]>("medicoai-selected-subjects", []);

  return useMemo(() => {
    let pool = getSubjectsForCourse(course);
    if (yearStr) {
      const year = getYearNumber(yearStr);
      pool = pool.filter(s => s.year === year);
    }
    if (selectedIds && selectedIds.length > 0) {
      const filtered = pool.filter(s => selectedIds.includes(s.id));
      if (filtered.length > 0) return filtered;
    }
    return pool;
  }, [yearStr, course, selectedIds]);
}
