import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface QuizHistoryProps {
  history: Record<string, { score: number; total: number }>;
}

const QuizHistory = ({ history }: QuizHistoryProps) => {
  const data = useMemo(() => {
    return Object.entries(history)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, { score, total }]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pct: Math.round((score / total) * 100),
        score,
        total,
      }));
  }, [history]);

  if (data.length < 2) return null;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-secondary" /> Quiz Score Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              formatter={(value: number) => [`${value}%`, "Score"]}
            />
            <Line type="monotone" dataKey="pct" stroke="hsl(170, 60%, 55%)" strokeWidth={2} dot={{ fill: "hsl(210, 55%, 24%)", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default QuizHistory;
