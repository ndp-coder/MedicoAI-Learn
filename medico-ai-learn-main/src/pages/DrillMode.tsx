import { useState, useEffect, useRef, useMemo } from "react";
import { Loader2, Zap, CheckCircle2, XCircle, Trophy, Timer, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { getProgress } from "@/lib/progressTracker";
import { getTestMarks } from "@/lib/testMarks";
import { trackQuizAttempt } from "@/lib/progressTracker";
import { logActivity } from "@/lib/activityLog";
import { logMistake } from "@/lib/mistakeLog";
import { awardXP } from "@/lib/gamification";
import { QuickActions } from "@/components/QuickActions";
import { toast } from "sonner";

interface DrillQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subjectArea: string;
}

const TIMER_SECONDS = 15;

const DrillMode = () => {
  const subjects = useUserSubjects();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [sessionDone, setSessionDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const weakSubjects = useMemo(() => {
    const progress = getProgress();
    const testMarks = getTestMarks();
    return subjects.filter(s => {
      const p = progress[s.id];
      const quizAccuracy = p && p.questionsAttempted > 0 ? (p.questionsCorrect / p.questionsAttempted) * 100 : null;
      const marks = testMarks.filter(m => m.subjectId === s.id);
      const testAvg = marks.length > 0 ? marks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / marks.length : null;
      return (quizAccuracy !== null && quizAccuracy < 70) || (testAvg !== null && testAvg < 70);
    }).map(s => s.name);
  }, []);

  const handleStart = async () => {
    const subjectsToUse = weakSubjects.length > 0 ? weakSubjects : subjects.slice(0, 3).map(s => s.name);
    setLoading(true);
    setQuestions([]);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setResults({});
    setSessionDone(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-drill", {
        body: { weakSubjects: subjectsToUse },
      });
      if (error) throw error;
      if (data?.questions) {
        setQuestions(data.questions);
        setTimeLeft(TIMER_SECONDS);
        logActivity("quiz");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate drill");
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (questions.length === 0 || answered || sessionDone) return;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQ, questions.length, sessionDone]);

  const handleTimeUp = () => {
    setAnswered(true);
    setResults(prev => ({ ...prev, [currentQ]: false }));
  };

  const handleAnswer = (index: number) => {
    if (answered) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(index);
    setAnswered(true);
    const correct = index === questions[currentQ].correctIndex;
    setResults(prev => ({ ...prev, [currentQ]: correct }));
    if (!correct) {
      logMistake({
        question: questions[currentQ].question,
        options: questions[currentQ].options,
        correctIndex: questions[currentQ].correctIndex,
        userAnswer: index,
        explanation: questions[currentQ].explanation,
        subjectId: questions[currentQ].subjectArea,
        source: "drill",
      });
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(i => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setSessionDone(true);
      // Track progress
      const correct = Object.values(results).filter(Boolean).length;
      trackQuizAttempt("drill", questions.length, correct);
      const xpResult = awardXP("drill", correct / questions.length);
      toast.success(`+${xpResult.xp} XP earned! ⚡`);
      if (xpResult.leveledUp && xpResult.newLevel) {
        toast.success(`🎉 Level up! ${xpResult.newLevel.emoji} ${xpResult.newLevel.name}!`);
      }
    }
  };

  const totalCorrect = Object.values(results).filter(Boolean).length;
  const accuracy = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

  if (sessionDone) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 animate-page-in space-y-5 text-center">
        <div className="w-20 h-20 rounded-2xl gradient-dental flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold">Drill Complete! ⚡</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{totalCorrect}/{questions.length}</span> correct ({accuracy}%)
        </p>
        <div className="grid grid-cols-5 gap-1.5 max-w-xs mx-auto">
          {questions.map((_, i) => (
            <div key={i} className={`h-2 rounded-full ${results[i] ? "bg-emerald-500" : "bg-red-400"}`} />
          ))}
        </div>

        <div className="space-y-2 text-left">
          {questions.map((q, i) => (
            <Card key={i} className={`border-none shadow-sm ${results[i] ? "opacity-60" : ""}`}>
              <CardContent className="p-3 text-xs">
                <div className="flex items-start gap-2">
                  {results[i] ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-medium">{q.question}</p>
                    {!results[i] && <p className="text-muted-foreground mt-1">✅ {q.options[q.correctIndex]} — {q.explanation}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <QuickActions context="drill" />

        <Button onClick={handleStart} className="w-full gradient-teal text-secondary-foreground font-semibold">
          <RotateCcw className="w-4 h-4 mr-2" /> New Drill
        </Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
        <div>
          <h2 className="text-lg font-bold">⚡ Weak Area Drill</h2>
          <p className="text-xs text-muted-foreground">Rapid-fire MCQs targeting your weak subjects</p>
        </div>

        {weakSubjects.length > 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-2">Detected weak areas:</p>
              <div className="flex flex-wrap gap-1.5">
                {weakSubjects.map(s => <Badge key={s} variant="destructive" className="text-[10px]">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 text-xs text-muted-foreground">
              No weak areas detected yet — take some quizzes or add test marks first. We'll use general topics for now.
            </CardContent>
          </Card>
        )}

        <Button onClick={handleStart} disabled={loading} className="w-full gradient-teal text-secondary-foreground font-semibold">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Preparing drill...</> : <><Zap className="w-4 h-4 mr-2" /> Start Drill (10 Qs · 15s each)</>}
        </Button>

        <div className="bg-muted rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold">Rules</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>10 rapid-fire MCQs from your weakest subjects</li>
            <li>15 seconds per question — no going back</li>
            <li>Missed timer = wrong answer</li>
          </ul>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">{currentQ + 1}/{questions.length}</Badge>
        <div className="flex items-center gap-2">
          <Timer className={`w-4 h-4 ${timeLeft <= 5 ? "text-red-500" : "text-muted-foreground"}`} />
          <span className={`text-sm font-bold tabular-nums ${timeLeft <= 5 ? "text-red-500" : ""}`}>{timeLeft}s</span>
        </div>
      </div>

      <Progress value={(timeLeft / TIMER_SECONDS) * 100} className="h-1.5" />
      <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1" />

      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <Badge variant="outline" className="text-[10px] w-fit mb-2">{q.subjectArea}</Badge>
          <CardTitle className="text-sm font-bold leading-relaxed">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {q.options.map((opt, oi) => {
            const isCorrect = answered && oi === q.correctIndex;
            const isWrong = answered && selectedAnswer === oi && oi !== q.correctIndex;
            const isTimedOut = answered && selectedAnswer === null;
            return (
              <button key={oi} onClick={() => handleAnswer(oi)} disabled={answered}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                  isCorrect ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700 font-semibold" :
                  isWrong ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700" :
                  answered ? "border-border opacity-50" :
                  "border-border hover:border-secondary hover:bg-muted cursor-pointer"
                }`}>
                <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline ml-2" />}
                {isWrong && <XCircle className="w-4 h-4 text-red-500 inline ml-2" />}
              </button>
            );
          })}

          {answered && (
            <div className="space-y-2 animate-slide-up">
              <p className="text-[10px] text-muted-foreground px-1">💡 {q.explanation}</p>
              <Button onClick={handleNext} size="sm" className="w-full gradient-teal text-secondary-foreground font-semibold">
                {currentQ < questions.length - 1 ? "Next →" : "View Results"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DrillMode;
