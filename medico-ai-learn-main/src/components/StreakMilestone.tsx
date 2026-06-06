import { useState, useEffect } from "react";
import { Flame, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const MILESTONES = [7, 14, 30, 50, 100];

export function StreakMilestone() {
  const [show, setShow] = useState(false);
  const [milestone, setMilestone] = useState(0);

  useEffect(() => {
    try {
      const streak = JSON.parse(localStorage.getItem("dentai-streak") || "0");
      const lastCelebrated = parseInt(localStorage.getItem("dentai-last-milestone") || "0");
      const hit = MILESTONES.find(m => streak >= m && m > lastCelebrated);
      if (hit) {
        setMilestone(hit);
        setShow(true);
        localStorage.setItem("dentai-last-milestone", hit.toString());
      }
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <Card className="border-none shadow-lg animate-scale-in overflow-hidden relative">
      <div className="absolute inset-0 gradient-dental opacity-10" />
      <CardContent className="p-4 flex items-center gap-3 relative">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0 animate-bounce">
          <Flame className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">🎉 {milestone}-Day Streak!</p>
          <p className="text-xs text-muted-foreground">Amazing consistency! Keep up the great work.</p>
        </div>
        <button onClick={() => setShow(false)} className="text-muted-foreground hover:text-foreground p-1">
          <X className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}
