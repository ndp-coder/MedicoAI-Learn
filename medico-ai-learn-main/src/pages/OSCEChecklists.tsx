import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Clock, AlertCircle, ArrowLeft, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OSCE_CHECKLISTS, type OSCEChecklist } from "@/lib/osceChecklists";
import { awardXP } from "@/lib/gamification";
import { toast } from "sonner";

const STORAGE_KEY = "dentai-osce-progress";

interface ChecklistProgress {
  [checklistId: string]: { completed: string[]; bestTimeSec?: number };
}

function loadProgress(): ChecklistProgress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveProgress(p: ChecklistProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

const OSCEChecklists = () => {
  const [active, setActive] = useState<OSCEChecklist | null>(null);
  const [progress, setProgress] = useState<ChecklistProgress>(loadProgress());
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      startRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        if (startRef.current) setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [active]);

  const toggle = (stepId: string) => {
    const next = new Set(checked);
    if (next.has(stepId)) next.delete(stepId);
    else next.add(stepId);
    setChecked(next);
  };

  const handleComplete = () => {
    if (!active) return;
    const missedCritical = active.steps
      .filter((s) => s.critical && !checked.has(s.id))
      .map((s) => s.text);

    const allDone = checked.size === active.steps.length;
    if (!allDone) {
      toast.error(`${active.steps.length - checked.size} steps not yet ticked`);
      return;
    }

    if (missedCritical.length > 0) {
      toast.warning(`Critical steps missed: ${missedCritical.length}`);
    }

    const result = awardXP("viva", missedCritical.length === 0 ? 1 : 0.5);
    const next = { ...progress };
    next[active.id] = {
      completed: Array.from(checked),
      bestTimeSec:
        progress[active.id]?.bestTimeSec === undefined
          ? elapsed
          : Math.min(progress[active.id].bestTimeSec!, elapsed),
    };
    setProgress(next);
    saveProgress(next);

    toast.success(`Completed! +${result.xp} XP in ${formatTime(elapsed)}`);
    if (result.leveledUp && result.newLevel) {
      toast.success(`Level up! ${result.newLevel.emoji} ${result.newLevel.name}`);
    }
    setActive(null);
    setChecked(new Set());
    setElapsed(0);
  };

  // Detail view
  if (active) {
    const completedCount = checked.size;
    const totalCount = active.steps.length;
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => { setActive(null); setChecked(new Set()); }}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-1 text-xs font-mono font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(elapsed)}
          </div>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{active.emoji}</span>
              <Badge variant="outline" className="text-[10px]">{active.category}</Badge>
            </div>
            <CardTitle className="text-base font-bold">{active.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{active.description}</p>
          </CardHeader>
          <CardContent className="space-y-1">
            <Progress value={(completedCount / totalCount) * 100} className="h-1.5 mb-2" />
            {active.steps.map((step, idx) => {
              const isChecked = checked.has(step.id);
              return (
                <button
                  key={step.id}
                  onClick={() => toggle(step.id)}
                  className={`w-full flex items-start gap-2 p-2.5 rounded-lg text-left transition-colors ${
                    isChecked ? "bg-emerald-50 dark:bg-emerald-950/30" : "hover:bg-muted"
                  }`}
                >
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                      <span className="font-semibold mr-1">{idx + 1}.</span>
                      {step.text}
                    </p>
                    {step.critical && (
                      <Badge variant="destructive" className="text-[9px] mt-1">
                        <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Critical
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
            <Button
              onClick={handleComplete}
              disabled={completedCount === 0}
              className="w-full mt-3 gradient-dental text-primary-foreground font-semibold"
            >
              Mark Complete · Earn XP
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
      <div>
        <h1 className="text-lg font-bold">🩺 OSCE Checklists</h1>
        <p className="text-xs text-muted-foreground">
          Step-by-step procedural drills · timed · scored
        </p>
      </div>

      <div className="space-y-2">
        {OSCE_CHECKLISTS.map((c) => {
          const prog = progress[c.id];
          const done = prog?.completed?.length ?? 0;
          const best = prog?.bestTimeSec;
          return (
            <Card
              key={c.id}
              className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => { setActive(c); setChecked(new Set()); setElapsed(0); }}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.category} · {c.steps.length} steps · ~{c.estMinutes} min
                  </p>
                  {best !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] text-muted-foreground">
                        Best: {formatTime(best)}
                      </span>
                    </div>
                  )}
                </div>
                {done > 0 && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {done}/{c.steps.length}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default OSCEChecklists;
