import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Layers, Flame, CalendarClock, X, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDueFlashcards } from "@/lib/flashcards";
import { getActivityLog } from "@/lib/activityLog";

interface Reminder {
  id: string;
  icon: typeof BookOpen;
  text: string;
  action: string;
  path: string;
  color: string;
}

export function StudyReminder() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem("dentai-dismissed-reminders");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  // Browser notification scheduling
  useEffect(() => {
    const notifEnabled = localStorage.getItem("dentai-notifications") === "true";
    if (!notifEnabled || !("Notification" in window)) return;

    const scheduleCheck = () => {
      const log = getActivityLog();
      const today = new Date().toISOString().split("T")[0];
      const todayActivity = log[today];
      const hour = new Date().getHours();

      // Evening reminder if no activity
      if (hour >= 18 && !todayActivity) {
        if (Notification.permission === "granted") {
          new Notification("🦷 MedicoAI Learn", {
            body: "You haven't studied today! Your streak is at risk.",
            icon: "/favicon.ico",
          });
        }
      }
    };

    // Check once on mount
    const timeout = setTimeout(scheduleCheck, 5000);
    return () => clearTimeout(timeout);
  }, []);

  const reminders = useMemo(() => {
    const items: Reminder[] = [];
    const today = new Date().toISOString().split("T")[0];
    const log = getActivityLog();
    const todayActivity = log[today];

    if (!todayActivity?.quiz) {
      items.push({ id: "quiz", icon: BookOpen, text: "You haven't taken today's quiz yet", action: "Take Quiz", path: "/quiz", color: "text-amber-600 dark:text-amber-400" });
    }

    const dueCount = getDueFlashcards().length;
    if (dueCount > 0) {
      items.push({ id: "flashcards", icon: Layers, text: `${dueCount} flashcard${dueCount > 1 ? "s" : ""} due for review`, action: "Review", path: "/flashcards", color: "text-purple-600 dark:text-purple-400" });
    }

    const dates = Object.keys(log).sort().reverse();
    if (dates.length > 0) {
      const lastActive = new Date(dates[0]);
      const daysSince = Math.floor((Date.now() - lastActive.getTime()) / 86400000);
      if (daysSince >= 2) {
        items.push({ id: "inactive", icon: Flame, text: `You haven't studied in ${daysSince} days`, action: "Start Now", path: "/doubt", color: "text-red-600 dark:text-red-400" });
      }
    }

    try {
      const examDate = localStorage.getItem("dentai-exam-date");
      const examName = localStorage.getItem("dentai-exam-name");
      if (examDate) {
        const daysLeft = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);
        if (daysLeft > 0 && daysLeft <= 7) {
          items.push({ id: "exam", icon: CalendarClock, text: `${examName || "Exam"} is in ${daysLeft} day${daysLeft > 1 ? "s" : ""} — step up!`, action: "Study", path: "/study-plan", color: "text-red-600 dark:text-red-400" });
        }
      }
    } catch {}

    return items.filter(r => !dismissed.has(r.id));
  }, [dismissed]);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    sessionStorage.setItem("dentai-dismissed-reminders", JSON.stringify([...next]));
  };

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2">
      {reminders.map((r) => (
        <Card key={r.id} className="border-none shadow-sm animate-scale-in">
          <CardContent className="p-3 flex items-center gap-3">
            <r.icon className={`w-5 h-5 shrink-0 ${r.color}`} />
            <p className="text-xs flex-1">{r.text}</p>
            <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={() => navigate(r.path)}>
              {r.action}
            </Button>
            <button onClick={() => dismiss(r.id)} className="text-muted-foreground hover:text-foreground p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
