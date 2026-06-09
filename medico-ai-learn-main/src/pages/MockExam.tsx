import { useState, useEffect, useRef } from "react";
import { Loader2, Trophy, Timer, AlertTriangle, CheckCircle2, XCircle, RotateCcw, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { logMistake } from "@/lib/mistakeLog";
import { awardXP } from "@/lib/gamification";
import { logActivity } from "@/lib/activityLog";
import { toast } from "sonner";

interface MockQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subjectArea: string;
}

type ExamLength = "25" | "50" | "100";

const EXAM_TIMES: Record<ExamLength, number> = { "25": 30 * 60, "50": 60 * 60, "100": 120 * 60 };

const MockExam = () => {
  const { canAccess, loading: isSubLoading } = useSubscription();
  const hasProAccess = canAccess("pro");
  const subjects = useUserSubjects();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [examDone, setExamDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examLength, setExamLength] = useState<ExamLength>("50");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startExam = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-mock-exam", {
        body: { count: parseInt(examLength) },
      });
      if (error) throw error;
      if (data?.questions) {
        setQuestions(data.questions);
        setCurrentQ(0);
        setAnswers({});
        setExamDone(false);
        setTimeLeft(EXAM_TIMES[examLength]);
        logActivity("quiz");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate mock exam");
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (questions.length === 0 || examDone) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [questions.length, examDone]);

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamDone(true);
    
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
    
    // Log mistakes
    questions.forEach((q, i) => {
      if (answers[i] !== q.correctIndex) {
        logMistake({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          userAnswer: answers[i] ?? -1,
          explanation: q.explanation,
          subjectId: q.subjectArea,
          source: "mock",
        });
      }
    });
    
    awardXP("mockExam", score / questions.length);
  };

  const handleAnswer = (idx: number) => {
    setAnswers(prev => ({ ...prev, [currentQ]: idx }));
  };

  const formatTime = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleExportResult = () => {
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const bySubject: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!bySubject[q.subjectArea]) bySubject[q.subjectArea] = { correct: 0, total: 0 };
      bySubject[q.subjectArea].total += 1;
      if (answers[i] === q.correctIndex) bySubject[q.subjectArea].correct += 1;
    });
    
    let text = `MedicoAI Mock Exam Report\n${"=".repeat(40)}\n\nScore: ${score}/${questions.length} (${Math.round((score / questions.length) * 100)}%)\n\nSubject Breakdown:\n`;
    Object.entries(bySubject).forEach(([s, d]) => {
      text += `  ${s}: ${d.correct}/${d.total} (${Math.round((d.correct / d.total) * 100)}%)\n`;
    });
    text += `\n\nIncorrect Questions:\n`;
    questions.forEach((q, i) => {
      if (answers[i] !== q.correctIndex) {
        text += `\nQ${i + 1}. ${q.question}\n  Your answer: ${answers[i] !== undefined ? q.options[answers[i]] : "Unanswered"}\n  Correct: ${q.options[q.correctIndex]}\n  ${q.explanation}\n`;
      }
    });
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MedicoAI_Mock_Exam_Report.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded! 📄");
  };

  // Results view
  if (examDone) {
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);
    const pct = Math.round((score / questions.length) * 100);
    const bySubject: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, i) => {
      if (!bySubject[q.subjectArea]) bySubject[q.subjectArea] = { correct: 0, total: 0 };
      bySubject[q.subjectArea].total += 1;
      if (answers[i] === q.correctIndex) bySubject[q.subjectArea].correct += 1;
    });

    return (
      <div className="max-w-lg mx-auto px-4 py-8 animate-page-in space-y-5">
        {!isSubLoading && !hasProAccess && (
          <UpgradeOverlay featureName="Mock Exam" requiredPlan="Pro" />
        )}
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl gradient-dental flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Mock Exam Complete!</h2>
          <p className="text-3xl font-bold mt-2">{score}/{questions.length}</p>
          <p className="text-sm text-muted-foreground">{pct}% — {pct >= 70 ? "Pass! 🎉" : "Needs improvement 💪"}</p>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Subject Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(bySubject).map(([sub, d]) => (
              <div key={sub} className="flex items-center gap-2">
                <p className="text-xs flex-1 truncate">{sub}</p>
                <Progress value={(d.correct / d.total) * 100} className="h-2 flex-1" />
                <p className="text-xs font-bold w-12 text-right">{d.correct}/{d.total}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={handleExportResult} variant="outline" className="flex-1 text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Download Report
          </Button>
          <Button onClick={startExam} className="flex-1 gradient-teal text-secondary-foreground font-semibold text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> New Exam
          </Button>
        </div>

        {/* Review wrong answers */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold">Review Incorrect</h3>
          {questions.map((q, i) => {
            if (answers[i] === q.correctIndex) return null;
            return (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-3 text-xs">
                  <p className="font-medium mb-1">Q{i + 1}. {q.question}</p>
                  <p className="text-red-500">Your: {answers[i] !== undefined ? q.options[answers[i]] : "Unanswered"}</p>
                  <p className="text-emerald-600 dark:text-emerald-400">Correct: {q.options[q.correctIndex]}</p>
                  <p className="text-muted-foreground mt-1">{q.explanation}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Setup
  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
        {!isSubLoading && !hasProAccess && (
          <UpgradeOverlay featureName="Mock Exam" requiredPlan="Pro" />
        )}
        <div>
          <h2 className="text-lg font-bold">📋 Mock Exam</h2>
          <p className="text-xs text-muted-foreground">Full-length exam simulation</p>
        </div>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Number of Questions</label>
              <Select value={examLength} onValueChange={(v) => setExamLength(v as ExamLength)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 Questions (30 min)</SelectItem>
                  <SelectItem value="50">50 Questions (1 hour)</SelectItem>
                  <SelectItem value="100">100 Questions (2 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startExam} disabled={loading} className="w-full gradient-teal text-secondary-foreground font-semibold">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : "Start Mock Exam"}
            </Button>
          </CardContent>
        </Card>
        <div className="bg-muted rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Exam Rules</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>No going back — once you move to the next question, you can't return</li>
            <li>Mixed subjects weighted by university pattern</li>
            <li>Strict timer — exam auto-submits when time runs out</li>
            <li>Detailed analysis and report card at the end</li>
          </ul>
        </div>
      </div>
    );
  }

  // Active exam
  const q = questions[currentQ];
  const answered = answers[currentQ] !== undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in relative min-h-[60vh]">
      {!isSubLoading && !hasProAccess && (
        <UpgradeOverlay featureName="Mock Exam" requiredPlan="Pro" />
      )}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">Q {currentQ + 1}/{questions.length}</Badge>
        <div className="flex items-center gap-2">
          <Timer className={`w-4 h-4 ${timeLeft < 300 ? "text-red-500" : "text-muted-foreground"}`} />
          <span className={`text-sm font-bold tabular-nums ${timeLeft < 300 ? "text-red-500" : ""}`}>{formatTime(timeLeft)}</span>
        </div>
      </div>
      <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1" />

      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <Badge variant="outline" className="text-[10px] w-fit mb-2">{q.subjectArea}</Badge>
          <CardTitle className="text-sm font-bold leading-relaxed">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {q.options.map((opt, oi) => (
            <button key={oi} onClick={() => handleAnswer(oi)}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                answers[currentQ] === oi ? "border-secondary bg-secondary/10 font-semibold" : "border-border hover:border-secondary cursor-pointer"
              }`}>
              <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
            </button>
          ))}
          <Button onClick={() => {
            if (currentQ < questions.length - 1) setCurrentQ(i => i + 1);
            else finishExam();
          }} disabled={!answered} className="w-full gradient-teal text-secondary-foreground font-semibold mt-2">
            {currentQ < questions.length - 1 ? "Next →" : "Finish Exam"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MockExam;
