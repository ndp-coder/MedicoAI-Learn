import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { differenceInDays } from "date-fns";

export function ExamCountdown() {
  const [examDate] = useLocalStorage<string>("dentai-exam-date", "");
  const [examName] = useLocalStorage<string>("dentai-exam-name", "");

  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    return differenceInDays(new Date(examDate), new Date());
  }, [examDate]);

  if (daysLeft === null || daysLeft < 0) return null;

  const urgency = daysLeft <= 7 ? "text-red-600 dark:text-red-400" : daysLeft <= 30 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
  const bgUrgency = daysLeft <= 7 ? "bg-red-50 dark:bg-red-950/30" : daysLeft <= 30 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-emerald-50 dark:bg-emerald-950/30";
  const message = daysLeft === 0 ? "Exam is today! You've got this! 💪" : daysLeft <= 3 ? "Final push! Focus on weak areas 🔥" : daysLeft <= 7 ? "One week to go! Revise key topics 📚" : daysLeft <= 30 ? "Stay consistent, you're on track! ✨" : "Plenty of time. Build strong foundations! 🌱";

  return (
    <Card className={`border-none shadow-sm ${bgUrgency}`}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgUrgency}`}>
          <CalendarClock className={`w-6 h-6 ${urgency}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${urgency}`}>{daysLeft}</span>
            <span className="text-xs text-muted-foreground">days until {examName || "exam"}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
