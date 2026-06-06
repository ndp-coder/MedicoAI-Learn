import { useMemo, useState } from "react";
import { TrendingUp, Brain, Target, Clock, BarChart3, Award, Loader2, FileText, Copy, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { getProgress } from "@/lib/progressTracker";
import { getFlashcards, getDueFlashcards } from "@/lib/flashcards";
import { getStudyHoursLog } from "@/lib/weeklyGoals";
import { getActivityLog } from "@/lib/activityLog";
import { getTestMarks } from "@/lib/testMarks";
import { SubjectRadarChart } from "@/components/SubjectRadarChart";
import { StudyHeatmap } from "@/components/StudyHeatmap";
import { Leaderboard } from "@/components/Leaderboard";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

const Analytics = () => {
  const subjects = useUserSubjects();
  const progress = useMemo(() => getProgress(), []);
  const flashcards = useMemo(() => getFlashcards(), []);
  const dueCards = useMemo(() => getDueFlashcards(), []);
  const hoursLog = useMemo(() => getStudyHoursLog(), []);
  const activityLog = useMemo(() => getActivityLog(), []);
  const testMarks = useMemo(() => getTestMarks(), []);
  const [studentName] = useLocalStorage("dentai-student-name", "");
  const [yearOfStudy] = useLocalStorage("dentai-year", "");

  const [report, setReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Compute quiz accuracy over time
  const quizHistory = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("dentai-quiz-history") || "{}");
    } catch { return {}; }
  }, []);

  const quizTrend = useMemo(() => {
    return Object.entries(quizHistory)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, data]: [string, any]) => ({
        date: date.slice(5),
        accuracy: Math.round((data.score / data.total) * 100),
      }));
  }, [quizHistory]);

  // Flashcard retention stats
  const retentionData = useMemo(() => {
    const intervals = [
      { label: "New", min: 0, max: 0 },
      { label: "1d", min: 1, max: 1 },
      { label: "2-6d", min: 2, max: 6 },
      { label: "1-2w", min: 7, max: 14 },
      { label: "2w+", min: 15, max: 999 },
    ];
    return intervals.map(({ label, min, max }) => ({
      label,
      count: flashcards.filter(c => c.interval >= min && c.interval <= max).length,
    }));
  }, [flashcards]);

  // Subject scores for radar
  const subjectScores = useMemo(() => {
    return subjects.map(s => {
      const p = progress[s.id];
      const quizScore = p && p.questionsAttempted > 0
        ? Math.round((p.questionsCorrect / p.questionsAttempted) * 100) : 0;
      const marks = testMarks.filter(m => m.subjectId === s.id);
      const testScore = marks.length > 0
        ? Math.round(marks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / marks.length) : 0;
      const topics = p?.topicsReviewed?.length || 0;
      const composite = Math.round((quizScore * 0.4 + testScore * 0.4 + Math.min(100, topics * 10) * 0.2));
      return { name: s.name.split(" ")[0], score: composite, quiz: quizScore, test: testScore };
    });
  }, [progress, testMarks]);

  // Readiness score
  const readiness = useMemo(() => {
    const totalQ = Object.values(progress).reduce((s, p) => s + p.questionsAttempted, 0);
    const totalCorrect = Object.values(progress).reduce((s, p) => s + p.questionsCorrect, 0);
    const accuracy = totalQ > 0 ? (totalCorrect / totalQ) * 100 : 0;
    const totalHours = hoursLog.reduce((s, l) => s + l.hoursStudied, 0);
    const totalTopics = Object.values(progress).reduce((s, p) => s + (p.topicsReviewed?.length || 0), 0);
    const flashcardMastery = flashcards.length > 0
      ? (flashcards.filter(c => c.repetitions >= 3).length / flashcards.length) * 100 : 0;
    return Math.min(100, Math.round(accuracy * 0.3 + Math.min(100, totalHours * 2) * 0.2 + Math.min(100, totalTopics * 5) * 0.2 + flashcardMastery * 0.3));
  }, [progress, hoursLog, flashcards]);

  const totalQ = Object.values(progress).reduce((s, p) => s + p.questionsAttempted, 0);
  const totalCorrect = Object.values(progress).reduce((s, p) => s + p.questionsCorrect, 0);
  const overallAccuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
  const activeDays = Object.keys(activityLog).length;
  const totalHours = Math.round(hoursLog.reduce((s, l) => s + l.hoursStudied, 0) * 10) / 10;

  const handleGenerateReport = async () => {
    setReportLoading(true);
    try {
      const subjectData = subjects.map(s => {
        const p = progress[s.id];
        const marks = testMarks.filter(m => m.subjectId === s.id);
        const flashcardCount = flashcards.filter(c => c.subjectId === s.id).length;
        const mastered = flashcards.filter(c => c.subjectId === s.id && c.repetitions >= 3).length;
        return {
          name: s.name,
          quizAccuracy: p && p.questionsAttempted > 0 ? Math.round((p.questionsCorrect / p.questionsAttempted) * 100) : null,
          questionsAttempted: p?.questionsAttempted || 0,
          topicsCovered: p?.topicsReviewed?.length || 0,
          testAverage: marks.length > 0 ? Math.round(marks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / marks.length) : null,
          flashcards: flashcardCount,
          flashcardsMastered: mastered,
        };
      });

      const { data, error } = await supabase.functions.invoke("generate-progress-report", {
        body: {
          studentName,
          yearOfStudy,
          subjectData,
          overallStats: {
            totalQuestions: totalQ,
            overallAccuracy,
            totalHours,
            activeDays,
            totalFlashcards: flashcards.length,
            examReadiness: readiness,
          },
        },
      });
      if (error) throw error;
      setReport(data.report);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      toast.success("Report copied! 📋");
    }
  };

  const handlePrintReport = () => {
    if (!report) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>Progress Report</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}h1,h2,h3{color:#1a365d}ul{padding-left:20px}</style></head><body>${report.replace(/\n/g, "<br>")}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">📊 Analytics</h2>
          <p className="text-xs text-muted-foreground">Deep dive into your study performance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleGenerateReport}
          disabled={reportLoading}
        >
          {reportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
          Report
        </Button>
      </div>

      {/* Printable Report */}
      {report && (
        <Card className="border-none shadow-sm animate-slide-up">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">📄 Progress Report</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyReport}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrintReport}>
                  <Printer className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-xs">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Readiness Score */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold ${readiness >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : readiness >= 40 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
              {readiness}%
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Exam Readiness</p>
              <p className="text-xs text-muted-foreground">
                {readiness >= 70 ? "Looking great! Keep it up 🌟" : readiness >= 40 ? "Getting there — stay consistent 💪" : "More practice needed — you got this! 📚"}
              </p>
              <Progress value={readiness} className="h-1.5 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Brain, label: "Accuracy", value: `${overallAccuracy}%` },
          { icon: Target, label: "Questions", value: totalQ },
          { icon: Clock, label: "Hours", value: `${totalHours}h` },
          { icon: Award, label: "Active Days", value: activeDays },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="border-none shadow-sm">
            <CardContent className="p-2 text-center">
              <Icon className="w-4 h-4 mx-auto text-secondary mb-1" />
              <p className="text-sm font-bold">{value}</p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject Radar */}
      <SubjectRadarChart data={subjectScores} />

      {/* Quiz accuracy trend */}
      {quizTrend.length > 1 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" /> Quiz Accuracy Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={quizTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(170 60% 55%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Flashcard interval distribution */}
      {flashcards.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-secondary" /> Flashcard Intervals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={retentionData}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" fill="hsl(170 60% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Study Heatmap */}
      <StudyHeatmap />

      {/* Leaderboard */}
      <Leaderboard />
    </div>
  );
};

export default Analytics;
