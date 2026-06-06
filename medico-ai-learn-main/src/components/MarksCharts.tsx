import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";
import { allSubjects } from "@/lib/subjects";
import { type TestMark } from "@/lib/testMarks";
import { format } from "date-fns";

interface MarksChartsProps {
  marks: TestMark[];
}

const MarksCharts = ({ marks }: MarksChartsProps) => {
  // Subject-wise average
  const subjectData = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    marks.forEach((m) => {
      if (!grouped[m.subjectId]) grouped[m.subjectId] = { total: 0, count: 0 };
      grouped[m.subjectId].total += (m.marksObtained / m.totalMarks) * 100;
      grouped[m.subjectId].count++;
    });
    return Object.entries(grouped)
      .map(([id, { total, count }]) => ({
        subject: allSubjects.find((s) => s.id === id)?.name?.split(" ")[0] ?? id,
        avg: Math.round(total / count),
        tests: count,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [marks]);

  // Timeline trend
  const trendData = useMemo(() => {
    const sorted = [...marks].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((m) => ({
      date: format(new Date(m.date), "dd MMM"),
      pct: Math.round((m.marksObtained / m.totalMarks) * 100),
      name: m.testName.length > 12 ? m.testName.slice(0, 12) + "…" : m.testName,
    }));
  }, [marks]);

  if (marks.length < 2) return null;

  return (
    <div className="space-y-4">
      {/* Subject-wise Bar Chart */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-secondary" /> Subject Averages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value: number) => [`${value}%`, "Average"]}
              />
              <Bar dataKey="avg" fill="hsl(170 60% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Trend Line */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary" /> Performance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value: number, _: any, entry: any) => [`${value}%`, entry.payload.name]}
              />
              <Line
                type="monotone"
                dataKey="pct"
                stroke="hsl(210 55% 24%)"
                strokeWidth={2}
                dot={{ fill: "hsl(170 60% 55%)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarksCharts;
