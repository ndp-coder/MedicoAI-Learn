import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, BookOpen, Layers, CalendarDays, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDueFlashcards } from "@/lib/flashcards";
import { getActivityLog } from "@/lib/activityLog";
import { getStudyPlans } from "@/lib/studyPlan";

export function TodayAgenda() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const items = useMemo(() => {
    const agenda: { label: string; done: boolean; path: string; icon: typeof BookOpen }[] = [];
    const log = getActivityLog();
    const todayLog = log[today];

    // Quiz
    try {
      const quizHistory = JSON.parse(localStorage.getItem("dentai-quiz-history") || "{}");
      agenda.push({ label: "Daily Quiz", done: !!quizHistory[today], path: "/quiz", icon: BookOpen });
    } catch { agenda.push({ label: "Daily Quiz", done: false, path: "/quiz", icon: BookOpen }); }

    // Flashcards
    const dueCount = getDueFlashcards().length;
    agenda.push({ label: `Review flashcards${dueCount > 0 ? ` (${dueCount} due)` : ""}`, done: dueCount === 0 && !!todayLog?.flashcards, path: "/flashcards", icon: Layers });

    // Study plan tasks
    const plans = getStudyPlans();
    plans.forEach(plan => {
      const todayTask = plan.days.find(d => d.date === today);
      if (todayTask) {
        agenda.push({ label: `${todayTask.subject}: ${todayTask.topics?.[0] || "Study"}`, done: todayTask.completed, path: "/study-plan", icon: CalendarDays });
      }
    });

    // Weak area drill
    agenda.push({ label: "Weak area drill", done: false, path: "/drill", icon: Zap });

    return agenda;
  }, [today]);

  if (items.length === 0) return null;

  const completedCount = items.filter(i => i.done).length;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">📋 Today's Agenda</span>
          <span className="text-[10px] text-muted-foreground font-normal">{completedCount}/{items.length} done</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item, i) => (
          <button key={i} onClick={() => !item.done && navigate(item.path)}
            className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${item.done ? "opacity-50" : "hover:bg-muted cursor-pointer"}`}>
            {item.done ? <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
            <span className={`text-xs ${item.done ? "line-through text-muted-foreground" : "font-medium"}`}>{item.label}</span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
