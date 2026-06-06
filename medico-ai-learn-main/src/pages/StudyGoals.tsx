import { useState, useMemo, useCallback } from "react";
import { Target, Clock, BookOpen, RefreshCw, Layers, Plus, Save, Award, TrendingUp } from "lucide-react";
import { pushAllToCloud } from "@/lib/syncEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_GOALS, type WeeklyGoals, getWeeklyHours, getWeeklyActivityCounts, logStudyHours, getWeekRange, getStudyHoursLog } from "@/lib/weeklyGoals";
import { getActivityLog } from "@/lib/activityLog";
import { toast } from "sonner";

const ACHIEVEMENTS = [
  { days: 3, label: "3-Day Streak", emoji: "🔥" },
  { days: 7, label: "Week Warrior", emoji: "⚡" },
  { days: 14, label: "2-Week Champion", emoji: "🏆" },
  { days: 30, label: "Monthly Master", emoji: "👑" },
];

const StudyGoals = () => {
  const [goals, setGoals] = useLocalStorage<WeeklyGoals>("dentai-weekly-goals", DEFAULT_GOALS);
  const [editGoals, setEditGoals] = useState<WeeklyGoals>(goals);
  const [hoursInput, setHoursInput] = useState("");
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const weeklyHours = useMemo(() => getWeeklyHours(), [refreshKey]);
  const activity = useMemo(() => getWeeklyActivityCounts(), [refreshKey]);
  const { start, end } = useMemo(() => getWeekRange(), []);

  // Streak calculation
  const currentStreak = useMemo(() => {
    const log = getActivityLog();
    let streak = 0;
    const d = new Date();
    const todayKey = d.toISOString().split("T")[0];
    if (!log[todayKey]) d.setDate(d.getDate() - 1);
    while (true) {
      const key = d.toISOString().split("T")[0];
      const day = log[key];
      if (day && (day.quiz || day.recap || day.flashcards)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  }, [refreshKey]);

  // Daily breakdown for bar chart
  const dailyData = useMemo(() => {
    const logs = getStudyHoursLog();
    const { start } = getWeekRange();
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((name, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = logs.find((l) => l.date === dateStr);
      return { name, hours: entry ? Math.round(entry.hoursStudied * 10) / 10 : 0 };
    });
  }, [refreshKey]);

  // Today's summary
  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const log = getActivityLog();
    const dayLog = log[today];
    const items: string[] = [];
    if (dayLog?.quiz) items.push("Quiz ✓");
    if (dayLog?.recap) items.push("Recap ✓");
    if (dayLog?.flashcards) items.push("Flashcards ✓");
    return items;
  }, [refreshKey]);

  const handleLogHours = useCallback(() => {
    const hrs = parseFloat(hoursInput);
    if (isNaN(hrs) || hrs <= 0 || hrs > 24) {
      toast.error("Enter a valid number of hours (0.5–24)");
      return;
    }
    logStudyHours(hrs);
    setHoursInput("");
    setRefreshKey((k) => k + 1);
    toast.success(`${hrs}h logged! 📚`);
  }, [hoursInput]);

  const handleSaveGoals = () => {
    setGoals(editGoals);
    setShowGoalEditor(false);
    toast.success("Goals updated! 🎯");
    pushAllToCloud();
  };

  const overallPct = useMemo(() => {
    const items = [
      activity.quizzes / goals.targetQuizzes,
      activity.recaps / goals.targetRecaps,
      activity.flashcards / goals.targetFlashcards,
      weeklyHours / goals.targetHours,
    ];
    return Math.min(100, Math.round((items.reduce((s, v) => s + Math.min(1, v), 0) / 4) * 100));
  }, [activity, goals, weeklyHours]);

  const motivationMsg = overallPct >= 100 ? "🌟 All goals reached! Amazing work!" : overallPct >= 75 ? "💪 Almost there, keep it up!" : overallPct >= 50 ? "📚 Halfway done, nice progress!" : "🚀 Let's get studying!";

  const progressItems = [
    { label: "Quizzes", icon: BookOpen, current: activity.quizzes, target: goals.targetQuizzes, color: "text-blue-600 dark:text-blue-400" },
    { label: "Recaps", icon: RefreshCw, current: activity.recaps, target: goals.targetRecaps, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Flashcards", icon: Layers, current: activity.flashcards, target: goals.targetFlashcards, color: "text-purple-600 dark:text-purple-400" },
    { label: "Study Hours", icon: Clock, current: Math.round(weeklyHours * 10) / 10, target: goals.targetHours, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Weekly Goals</h2>
          <p className="text-xs text-muted-foreground">
            {new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        <Dialog open={showGoalEditor} onOpenChange={setShowGoalEditor}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => setEditGoals(goals)}>
              <Target className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Set Weekly Targets</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              {[
                { key: "targetQuizzes" as const, label: "Quizzes per week", icon: BookOpen },
                { key: "targetRecaps" as const, label: "Recaps per week", icon: RefreshCw },
                { key: "targetFlashcards" as const, label: "Flashcard reviews", icon: Layers },
                { key: "targetHours" as const, label: "Study hours", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <label className="text-sm flex-1">{label}</label>
                  <Input type="number" min={1} max={100} value={editGoals[key]} onChange={(e) => setEditGoals({ ...editGoals, [key]: Math.max(1, parseInt(e.target.value) || 1) })} className="w-20 text-center" />
                </div>
              ))}
              <Button onClick={handleSaveGoals} className="w-full gradient-teal text-secondary-foreground font-semibold">
                <Save className="w-4 h-4 mr-1" /> Save Goals
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall + Motivation */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Overall Progress</span>
            <span className="text-sm font-bold">{overallPct}%</span>
          </div>
          <Progress value={overallPct} className="h-2.5 mb-2" />
          <p className="text-xs text-muted-foreground">{motivationMsg}</p>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      {todaySummary.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary shrink-0" />
            <span className="text-xs font-medium">Today: {todaySummary.join(" · ")}</span>
          </CardContent>
        </Card>
      )}

      {/* Progress Cards */}
      <div className="grid grid-cols-2 gap-3">
        {progressItems.map(({ label, icon: Icon, current, target, color }) => {
          const pct = Math.min(100, Math.round((current / target) * 100));
          const done = current >= target;
          return (
            <Card key={label} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-semibold">{label}</span>
                </div>
                <p className="text-2xl font-bold mb-1">
                  {current}<span className="text-sm font-normal text-muted-foreground">/{target}</span>
                </p>
                <Progress value={pct} className="h-2 mb-1" />
                <p className="text-[10px] text-muted-foreground">{done ? "✅ Goal reached!" : `${pct}% complete`}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Breakdown Chart */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" /> Daily Study Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} formatter={(value: number) => [`${value}h`, "Hours"]} />
              <Bar dataKey="hours" fill="hsl(170, 60%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-secondary" /> Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ACHIEVEMENTS.map(({ days, label, emoji }) => {
              const earned = currentStreak >= days;
              return (
                <Badge key={days} variant={earned ? "secondary" : "outline"} className={`text-xs ${!earned ? "opacity-40" : ""}`}>
                  {emoji} {label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Log Study Hours */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" /> Log Study Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input type="number" step="0.5" min="0.5" max="24" placeholder="Hours studied today..." value={hoursInput} onChange={(e) => setHoursInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogHours()} />
            <Button onClick={handleLogHours} className="gradient-teal text-secondary-foreground font-semibold shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Log
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Today's total will be added to your weekly hours.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyGoals;
