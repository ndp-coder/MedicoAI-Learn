import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { getStudyHoursLog } from "@/lib/weeklyGoals";
import { getActivityLog } from "@/lib/activityLog";

export function StudyHeatmap() {
  const data = useMemo(() => {
    const hoursLog = getStudyHoursLog();
    const activityLog = getActivityLog();
    const map: Record<string, number> = {};

    // Hours log contributes intensity
    hoursLog.forEach(l => {
      map[l.date] = (map[l.date] || 0) + l.hoursStudied;
    });

    // Activity log adds base intensity
    Object.entries(activityLog).forEach(([date, act]) => {
      const activities = [act.quiz, act.recap, act.flashcards].filter(Boolean).length;
      map[date] = (map[date] || 0) + activities * 0.5;
    });

    return map;
  }, []);

  // Generate last 12 weeks of dates
  const weeks = useMemo(() => {
    const result: string[][] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek - 7 * 11);

    for (let w = 0; w < 12; w++) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        if (date <= today) {
          week.push(date.toISOString().split("T")[0]);
        } else {
          week.push("");
        }
      }
      result.push(week);
    }
    return result;
  }, []);

  const getIntensity = (date: string) => {
    if (!date) return "bg-transparent";
    const val = data[date] || 0;
    if (val === 0) return "bg-muted";
    if (val < 1) return "bg-emerald-200 dark:bg-emerald-900";
    if (val < 2) return "bg-emerald-300 dark:bg-emerald-800";
    if (val < 4) return "bg-emerald-400 dark:bg-emerald-700";
    return "bg-emerald-500 dark:bg-emerald-600";
  };

  const hasData = Object.keys(data).length > 0;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-secondary" /> Study Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-xs text-muted-foreground text-center py-4">Start studying to see your heatmap!</p>
        ) : (
          <>
            <div className="flex gap-0.5 overflow-x-auto pb-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((date, di) => (
                    <div
                      key={di}
                      className={`w-3 h-3 rounded-[2px] ${getIntensity(date)}`}
                      title={date ? `${date}: ${(data[date] || 0).toFixed(1)}h` : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-2 justify-end">
              <span className="text-[9px] text-muted-foreground">Less</span>
              {["bg-muted", "bg-emerald-200 dark:bg-emerald-900", "bg-emerald-300 dark:bg-emerald-800", "bg-emerald-400 dark:bg-emerald-700", "bg-emerald-500 dark:bg-emerald-600"].map((c, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />
              ))}
              <span className="text-[9px] text-muted-foreground">More</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
