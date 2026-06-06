import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, CalendarClock } from "lucide-react";
import { getFlashcards, getDueFlashcards, type Flashcard } from "@/lib/flashcards";
import { allSubjects } from "@/lib/subjects";

export function FlashcardStats() {
  const cards = useMemo(() => getFlashcards(), []);
  const dueCards = useMemo(() => getDueFlashcards(), []);

  // Interval distribution
  const intervalData = useMemo(() => {
    const buckets: Record<string, number> = { "New": 0, "1d": 0, "2-6d": 0, "7-14d": 0, "15-30d": 0, "30d+": 0 };
    cards.forEach(c => {
      if (c.repetitions === 0) buckets["New"]++;
      else if (c.interval <= 1) buckets["1d"]++;
      else if (c.interval <= 6) buckets["2-6d"]++;
      else if (c.interval <= 14) buckets["7-14d"]++;
      else if (c.interval <= 30) buckets["15-30d"]++;
      else buckets["30d+"]++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [cards]);

  // Subject breakdown
  const subjectData = useMemo(() => {
    const grouped: Record<string, { total: number; mastered: number }> = {};
    cards.forEach(c => {
      if (!grouped[c.subjectId]) grouped[c.subjectId] = { total: 0, mastered: 0 };
      grouped[c.subjectId].total++;
      if (c.repetitions >= 3) grouped[c.subjectId].mastered++;
    });
    return Object.entries(grouped).map(([id, data]) => ({
      name: allSubjects.find(s => s.id === id)?.name?.split(" ")[0] ?? id,
      total: data.total,
      mastered: data.mastered,
      retention: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
    }));
  }, [cards]);

  // Due predictions
  const duePredictions = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const weekStr = nextWeek.toISOString().split("T")[0];
    
    const dueTomorrow = cards.filter(c => c.nextReview === tomorrowStr).length;
    const dueThisWeek = cards.filter(c => c.nextReview >= new Date().toISOString().split("T")[0] && c.nextReview <= weekStr).length;
    
    return { dueTomorrow, dueThisWeek };
  }, [cards]);

  // Overall retention
  const overallRetention = useMemo(() => {
    if (cards.length === 0) return 0;
    const mastered = cards.filter(c => c.repetitions >= 3).length;
    return Math.round((mastered / cards.length) * 100);
  }, [cards]);

  const COLORS = ["hsl(var(--muted-foreground))", "hsl(210, 55%, 60%)", "hsl(170, 60%, 55%)", "hsl(45, 80%, 55%)", "hsl(280, 50%, 60%)", "hsl(340, 60%, 55%)"];

  if (cards.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{overallRetention}%</p>
            <p className="text-[10px] text-muted-foreground">Retention</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{duePredictions.dueTomorrow}</p>
            <p className="text-[10px] text-muted-foreground">Due Tomorrow</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{duePredictions.dueThisWeek}</p>
            <p className="text-[10px] text-muted-foreground">Due This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Interval Distribution */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Brain className="w-4 h-4 text-secondary" /> SRS Intervals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={intervalData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {intervalData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Retention */}
      {subjectData.length > 1 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" /> Subject Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subjectData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="text-xs w-20 truncate">{s.name}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${s.retention}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-12 text-right">{s.mastered}/{s.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
