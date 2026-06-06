import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getActivityLog } from "@/lib/activityLog";
import { getWeeklyHours, getWeekRange } from "@/lib/weeklyGoals";
import { getProgress } from "@/lib/progressTracker";

export function Leaderboard() {
  const stats = useMemo(() => {
    const { start, end } = getWeekRange();
    const log = getActivityLog();
    const progress = getProgress();

    // This week
    let thisWeekQuizzes = 0;
    let thisWeekActivities = 0;
    Object.entries(log).forEach(([date, act]) => {
      if (date >= start && date <= end) {
        if (act.quiz) thisWeekQuizzes++;
        thisWeekActivities += [act.quiz, act.recap, act.flashcards].filter(Boolean).length;
      }
    });
    const thisWeekHours = getWeeklyHours();

    // Last week
    const lastStart = new Date(start);
    lastStart.setDate(lastStart.getDate() - 7);
    const lastEnd = new Date(start);
    lastEnd.setDate(lastEnd.getDate() - 1);
    const ls = lastStart.toISOString().split("T")[0];
    const le = lastEnd.toISOString().split("T")[0];

    let lastWeekQuizzes = 0;
    let lastWeekActivities = 0;
    Object.entries(log).forEach(([date, act]) => {
      if (date >= ls && date <= le) {
        if (act.quiz) lastWeekQuizzes++;
        lastWeekActivities += [act.quiz, act.recap, act.flashcards].filter(Boolean).length;
      }
    });

    const totalQ = Object.values(progress).reduce((s, p) => s + p.questionsAttempted, 0);
    const totalC = Object.values(progress).reduce((s, p) => s + p.questionsCorrect, 0);
    const accuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0;

    return {
      thisWeek: { quizzes: thisWeekQuizzes, activities: thisWeekActivities, hours: thisWeekHours },
      lastWeek: { quizzes: lastWeekQuizzes, activities: lastWeekActivities },
      accuracy,
    };
  }, []);

  const trend = (curr: number, prev: number) => {
    if (curr > prev) return { icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", text: "↑" };
    if (curr < prev) return { icon: TrendingDown, color: "text-red-600 dark:text-red-400", text: "↓" };
    return { icon: Minus, color: "text-muted-foreground", text: "—" };
  };

  const quizTrend = trend(stats.thisWeek.quizzes, stats.lastWeek.quizzes);
  const actTrend = trend(stats.thisWeek.activities, stats.lastWeek.activities);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Personal Best Challenge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <span className="text-xs">Quizzes this week</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{stats.thisWeek.quizzes}</span>
              <quizTrend.icon className={`w-3.5 h-3.5 ${quizTrend.color}`} />
              <span className="text-[10px] text-muted-foreground">vs {stats.lastWeek.quizzes}</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <span className="text-xs">Study activities</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{stats.thisWeek.activities}</span>
              <actTrend.icon className={`w-3.5 h-3.5 ${actTrend.color}`} />
              <span className="text-[10px] text-muted-foreground">vs {stats.lastWeek.activities}</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <span className="text-xs">Hours studied</span>
            <span className="text-sm font-bold">{Math.round(stats.thisWeek.hours * 10) / 10}h</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <span className="text-xs">Overall accuracy</span>
            <Badge variant="secondary" className="text-[10px]">{stats.accuracy}%</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
