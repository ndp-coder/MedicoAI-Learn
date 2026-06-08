export interface StudyPlanDay {
  date: string;
  subject: string;
  topics: string[];
  hours: number;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  examName: string;
  examDate: string;
  subjects: string[];
  days: StudyPlanDay[];
  createdAt: string;
}

const STORAGE_KEY = "dentai-study-plans";
import { pushToCloud } from "./syncEngine";

export function getStudyPlans(): StudyPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePlans(plans: StudyPlan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  pushToCloud(STORAGE_KEY, plans);
}

export function saveStudyPlan(plan: StudyPlan) {
  const plans = getStudyPlans();
  const idx = plans.findIndex(p => p.id === plan.id);
  if (idx >= 0) plans[idx] = plan;
  else plans.unshift(plan);
  savePlans(plans);
}

export function deleteStudyPlan(id: string) {
  const plans = getStudyPlans().filter(p => p.id !== id);
  savePlans(plans);
}

export function toggleDayComplete(planId: string, date: string) {
  const plans = getStudyPlans();
  const plan = plans.find(p => p.id === planId);
  if (!plan) return;
  const day = plan.days.find(d => d.date === date);
  if (day) day.completed = !day.completed;
  savePlans(plans);
}
