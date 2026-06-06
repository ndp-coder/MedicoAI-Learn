import { useMemo } from "react";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getActivityLog, getCurrentStreak, type DayActivity } from "@/lib/activityLog";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function getCalendarDays(): { date: string; day: number; isCurrentMonth: boolean }[] {
  const today = new Date();
  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  // Show last 35 days (5 weeks)
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split("T")[0],
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === today.getMonth(),
    });
  }
  return days;
}

function getActivityLevel(activity?: DayActivity): number {
  if (!activity) return 0;
  let level = 0;
  if (activity.quiz) level++;
  if (activity.recap) level++;
  if (activity.flashcards) level++;
  return level;
}

const levelColors = [
  "bg-muted",
  "bg-secondary/30",
  "bg-secondary/60",
  "bg-secondary",
];

const StreakCalendar = () => {
  const log = useMemo(() => getActivityLog(), []);
  const streak = useMemo(() => getCurrentStreak(), []);
  const days = useMemo(() => getCalendarDays(), []);
  const today = new Date().toISOString().split("T")[0];

  // Align to start on Monday
  const firstDayOfWeek = new Date(days[0].date).getDay();
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            Study Streak
          </h3>
          <div className="flex items-center gap-1.5 bg-muted rounded-full px-2.5 py-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-bold">{streak} day{streak !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="text-[9px] text-muted-foreground text-center font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for alignment */}
          {Array.from({ length: mondayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map(({ date, day, isCurrentMonth }) => {
            const activity = log[date];
            const level = getActivityLevel(activity);
            const isToday = date === today;
            const activityLabels: string[] = [];
            if (activity?.quiz) activityLabels.push("Quiz");
            if (activity?.recap) activityLabels.push("Recap");
            if (activity?.flashcards) activityLabels.push("Flashcards");

            return (
              <Tooltip key={date}>
                <TooltipTrigger asChild>
                  <div
                    className={`aspect-square rounded-sm flex items-center justify-center text-[9px] font-medium transition-colors cursor-default
                      ${levelColors[level]}
                      ${isToday ? "ring-1 ring-secondary ring-offset-1" : ""}
                      ${!isCurrentMonth ? "opacity-40" : ""}
                      ${level > 0 ? "text-secondary-foreground" : "text-muted-foreground"}
                    `}
                  >
                    {day}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold">{date}</p>
                  {activityLabels.length > 0 ? (
                    <p>{activityLabels.join(", ")}</p>
                  ) : (
                    <p className="text-muted-foreground">No activity</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[9px] text-muted-foreground">Less</span>
          {levelColors.map((color, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
          ))}
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCalendar;
