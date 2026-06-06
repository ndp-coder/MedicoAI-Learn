import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { Brain } from "lucide-react";

interface SubjectScore {
  name: string;
  score: number;
  quiz: number;
  test: number;
}

export function SubjectRadarChart({ data }: { data: SubjectScore[] }) {
  if (data.every(d => d.score === 0)) {
    return null;
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Brain className="w-4 h-4 text-secondary" /> Subject Strength Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(210 20% 90%)" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(210 15% 46%)" }} />
            <Radar name="Overall" dataKey="score" stroke="hsl(170 60% 55%)" fill="hsl(170 60% 55%)" fillOpacity={0.3} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-1">
          {data.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map((d, i) => (
            <div key={d.name} className="text-center">
              <p className="text-[10px] text-muted-foreground">{i === 0 ? "💪 Strongest" : i === 1 ? "📈 Good" : "🔄 Growing"}</p>
              <p className="text-xs font-semibold">{d.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
