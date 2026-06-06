import { useState, useMemo } from "react";
import { CalendarDays, Loader2, CheckCircle2, Circle, Trash2, Plus, Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { getProgress } from "@/lib/progressTracker";
import { getStudyPlans, saveStudyPlan, deleteStudyPlan, toggleDayComplete, type StudyPlan as StudyPlanType } from "@/lib/studyPlan";
import { toast } from "sonner";

const StudyPlan = () => {
  const subjects = useUserSubjects();
  const [plans, setPlans] = useState<StudyPlanType[]>(() => getStudyPlans());
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState<Date | undefined>();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const refresh = () => setPlans(getStudyPlans());

  const weakAreas = useMemo(() => {
    const progress = getProgress();
    return subjects
      .filter(s => {
        const p = progress[s.id];
        if (!p || p.questionsAttempted === 0) return false;
        return (p.questionsCorrect / p.questionsAttempted) < 0.7;
      })
      .map(s => s.name);
  }, []);

  const handleGenerate = async () => {
    if (!examName.trim() || !examDate || selectedSubjects.length === 0) {
      toast.error("Fill in exam name, date, and select subjects.");
      return;
    }

    const daysUntil = Math.ceil((examDate.getTime() - Date.now()) / 86400000);
    if (daysUntil <= 0) {
      toast.error("Exam date must be in the future.");
      return;
    }

    setLoading(true);
    try {
      const subjectNames = selectedSubjects.map(id => subjects.find(s => s.id === id)?.name || id);
      const { data, error } = await supabase.functions.invoke("generate-study-plan", {
        body: {
          examName: examName.trim(),
          examDate: examDate.toISOString().split("T")[0],
          subjects: subjectNames,
          weakAreas: weakAreas.length > 0 ? weakAreas.join(", ") : undefined,
        },
      });

      if (error) throw error;
      if (!data?.days) throw new Error("No plan generated");

      const plan: StudyPlanType = {
        id: crypto.randomUUID(),
        examName: examName.trim(),
        examDate: examDate.toISOString().split("T")[0],
        subjects: selectedSubjects,
        days: data.days.map((d: any) => ({ ...d, completed: false })),
        createdAt: new Date().toISOString(),
      };

      saveStudyPlan(plan);
      refresh();
      setShowCreate(false);
      setExamName("");
      setExamDate(undefined);
      setSelectedSubjects([]);
      toast.success("Study plan generated! 📅");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (planId: string, date: string) => {
    toggleDayComplete(planId, date);
    refresh();
  };

  const handleDeletePlan = (id: string) => {
    deleteStudyPlan(id);
    refresh();
    toast.success("Plan deleted");
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Study Plan</h2>
          <p className="text-xs text-muted-foreground">AI-generated day-by-day schedule</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-teal text-secondary-foreground font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" /> Generate Study Plan
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-semibold mb-1 block">Exam Name *</label>
                <Input placeholder="e.g., BDS 2nd Year Final" value={examName} onChange={(e) => setExamName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Exam Date *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !examDate && "text-muted-foreground")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {examDate ? format(examDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={examDate} onSelect={setExamDate} disabled={(d) => d <= new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Subjects to Cover *</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => (
                    <button key={s.id} onClick={() => toggleSubject(s.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedSubjects.includes(s.id) ? "bg-secondary text-secondary-foreground border-secondary" : "border-border hover:border-secondary"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              {weakAreas.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                    <Brain className="w-3 h-3 inline mr-1" /> Weak Areas Detected
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">{weakAreas.join(", ")} — AI will prioritize these</p>
                </div>
              )}
              <Button onClick={handleGenerate} disabled={loading} className="w-full gradient-teal text-secondary-foreground font-semibold">
                {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-1" /> Generate Plan</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-bold mb-1">No Study Plans</h3>
          <p className="text-sm text-muted-foreground">Create an AI-powered study plan for your upcoming exam.</p>
        </div>
      ) : (
        plans.map((plan) => {
          const completedDays = plan.days.filter(d => d.completed).length;
          const progress = plan.days.length > 0 ? Math.round((completedDays / plan.days.length) * 100) : 0;
          const daysLeft = Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / 86400000);

          return (
            <Card key={plan.id} className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">{plan.examName}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePlan(plan.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  <span>{daysLeft > 0 ? `${daysLeft} days left` : "Exam passed"}</span>
                  <span>·</span>
                  <span>{completedDays}/{plan.days.length} days done</span>
                  <span>·</span>
                  <span>{progress}% complete</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {plan.days.map((day) => {
                  const isToday = day.date === new Date().toISOString().split("T")[0];
                  const isPast = day.date < new Date().toISOString().split("T")[0];
                  return (
                    <div key={day.date}
                      className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${isToday ? "bg-secondary/10 border border-secondary/20" : day.completed ? "opacity-60" : isPast && !day.completed ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}
                      onClick={() => handleToggleDay(plan.id, day.date)}>
                      <div className="mt-0.5">
                        {day.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-secondary" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{format(new Date(day.date), "EEE, MMM d")}</span>
                          {isToday && <Badge variant="secondary" className="text-[8px] h-4">Today</Badge>}
                        </div>
                        <p className={`text-xs font-semibold ${day.completed ? "line-through" : ""}`}>{day.subject}</p>
                        <p className="text-[10px] text-muted-foreground">{day.topics?.join(", ")}</p>
                        <span className="text-[9px] text-muted-foreground">{day.hours}h recommended</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default StudyPlan;
