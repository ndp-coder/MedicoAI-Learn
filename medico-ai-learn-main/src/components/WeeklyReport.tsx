import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProgress } from "@/lib/progressTracker";
import { getWeeklyHours } from "@/lib/weeklyGoals";
import { getActivityLog } from "@/lib/activityLog";

export function WeeklyReport() {
  const report = useMemo(() => {
    const progress = getProgress();
    const log = getActivityLog();
    const weeklyHours = getWeeklyHours();

    // This week stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Last week stats
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekStartStr = lastWeekStart.toISOString().split("T")[0];

    let thisWeekActiveDays = 0;
    let lastWeekActiveDays = 0;

    Object.entries(log).forEach(([date, day]) => {
      const hasActivity = day.quiz || day.recap || day.flashcards;
      if (hasActivity) {
        if (date >= weekStartStr) thisWeekActiveDays++;
        else if (date >= lastWeekStartStr && date < weekStartStr) lastWeekActiveDays++;
      }
    });

    const totalQuestions = Object.values(progress).reduce((s, p) => s + p.questionsAttempted, 0);
    const totalCorrect = Object.values(progress).reduce((s, p) => s + p.questionsCorrect, 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const topicsReviewed = Object.values(progress).reduce((s, p) => s + (p.topicsReviewed?.length ?? 0), 0);

    return {
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      thisWeekActiveDays,
      lastWeekActiveDays,
      accuracy,
      totalQuestions,
      topicsReviewed,
      trend: thisWeekActiveDays > lastWeekActiveDays ? "up" : thisWeekActiveDays < lastWeekActiveDays ? "down" : "same",
    };
  }, []);

  const TrendIcon = report.trend === "up" ? TrendingUp : report.trend === "down" ? TrendingDown : Minus;
  const trendColor = report.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : report.trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
          Weekly Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold">{report.weeklyHours}h</p>
            <p className="text-[10px] text-muted-foreground">Studied</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold">{report.accuracy}%</p>
            <p className="text-[10px] text-muted-foreground">Accuracy</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold">{report.topicsReviewed}</p>
            <p className="text-[10px] text-muted-foreground">Topics</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Active days this week: {report.thisWeekActiveDays}</span>
          {report.trend !== "same" && (
            <Badge variant="secondary" className={`text-[10px] ${trendColor}`}>
              {report.trend === "up" ? "↑ Improving" : "↓ Needs work"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
