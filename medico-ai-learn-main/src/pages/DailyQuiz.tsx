import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Trophy, Flame, CheckCircle2, XCircle, Bookmark, BookOpen, Zap, Brain, MessageCircle, Share2, Send, Timer, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackQuizAttempt } from "@/lib/progressTracker";
import { logActivity } from "@/lib/activityLog";
import { addBookmark } from "@/lib/bookmarks";
import { addFlashcard } from "@/lib/flashcards";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { streamChat, type Msg } from "@/lib/stream";
import { logMistake } from "@/lib/mistakeLog";
import { awardXP } from "@/lib/gamification";
import { QuickActions } from "@/components/QuickActions";
import ReactMarkdown from "react-markdown";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeOverlay } from "@/components/UpgradeOverlay";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bookReference: string;
  subjectId?: string;
}

type Difficulty = "easy" | "medium" | "hard";

interface QuizHistoryEntry {
  score: number;
  total: number;
  subject?: string;
  difficulty?: string;
  date?: string;
}

const TOPIC_SUGGESTIONS = [
  "Enamel formation", "TMJ anatomy", "Salivary glands", "Blood supply of head",
  "Calcium metabolism", "Ameloblasts", "Tooth morphology", "Muscles of mastication",
];

const TIMER_SECONDS: Record<Difficulty, number> = {
  easy: 60,
  medium: 45,
  hard: 30,
};

const DailyQuiz = () => {
  const { canAccess, loading: isSubLoading } = useSubscription();
  const hasGoAccess = canAccess("go");
  const subjects = useUserSubjects();
  const today = new Date().toISOString().split("T")[0];
  const [quizHistory, setQuizHistory] = useLocalStorage<Record<string, QuizHistoryEntry[]>>("dentai-quiz-history-v2", {});
  const [streak, setStreak] = useLocalStorage("dentai-streak", 0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("random");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [bookmarkedQs, setBookmarkedQs] = useState<Set<number>>(new Set());
  const [savedAsCards, setSavedAsCards] = useState<Set<number>>(new Set());
  const [explainLoading, setExplainLoading] = useState<number | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [followUpInputs, setFollowUpInputs] = useState<Record<number, string>>({});
  const [followUpOpen, setFollowUpOpen] = useState<Record<number, boolean>>({});
  const [followUpLoading, setFollowUpLoading] = useState<number | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [showHistory, setShowHistory] = useState(false);

  // Timer state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timedOut, setTimedOut] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = TIMER_SECONDS[difficulty];

  // Timer countdown
  useEffect(() => {
    if (questions.length === 0 || submitted) return;

    if (timerRef.current) clearInterval(timerRef.current);

    setTimeLeft(totalTime);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up for this question
          setTimedOut((old) => new Set(old).add(currentQuestion));
          if (currentQuestion < questions.length - 1) {
            setCurrentQuestion((c) => c + 1);
            return totalTime;
          } else {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, questions.length, submitted, totalTime]);

  const loadQuiz = async () => {
    setLoading(true);
    setSubmitted(false);
    setAnswers({});
    setBookmarkedQs(new Set());
    setSavedAsCards(new Set());
    setExplanations({});
    setFollowUpInputs({});
    setFollowUpOpen({});
    setCurrentQuestion(0);
    setTimedOut(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          subjectId: selectedSubject !== "random" ? selectedSubject : undefined,
          difficulty,
          topic: customTopic.trim() || undefined,
          numQuestions,
        },
      });
      if (error) throw error;
      if (data?.questions) {
        setQuestions(data.questions);
        setTimeLeft(totalTime);
      }
    } catch (e) {
      console.error("Quiz generation error:", e);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(() => {
    // Allow partial answers (timed-out questions count as unanswered)
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0);

    const subjectStats: Record<string, { attempted: number; correct: number }> = {};
    questions.forEach((q, i) => {
      const sid = q.subjectId || "physiology";
      if (!subjectStats[sid]) subjectStats[sid] = { attempted: 0, correct: 0 };
      subjectStats[sid].attempted += 1;
      if (answers[i] === q.correctIndex) {
        subjectStats[sid].correct += 1;
      } else {
        logMistake({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          userAnswer: answers[i],
          explanation: q.explanation,
          subjectId: sid,
          source: "quiz",
        });
      }
    });
    Object.entries(subjectStats).forEach(([sid, { attempted, correct }]) => {
      trackQuizAttempt(sid, attempted, correct);
    });

    logActivity("quiz");

    // Save to history array (multiple quizzes per day)
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || "Random Mix";
    const entry: QuizHistoryEntry = {
      score,
      total: questions.length,
      subject: subjectName,
      difficulty,
      date: new Date().toISOString(),
    };
    const todayEntries = quizHistory[today] || [];
    const updatedHistory = { ...quizHistory, [today]: [...todayEntries, entry] };
    setQuizHistory(updatedHistory);
    import("@/lib/syncEngine").then(({ syncToCloud }) => syncToCloud("quiz_history", () => updatedHistory));

    const result = awardXP("quiz", score / questions.length);
    toast.success(`+${result.xp} XP earned! ⚡`);
    if (result.leveledUp && result.newLevel) {
      toast.success(`🎉 Level up! You're now a ${result.newLevel.emoji} ${result.newLevel.name}!`);
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (quizHistory[yesterday]) {
      setStreak((s) => s + 1);
    } else {
      setStreak(1);
    }
  }, [questions, answers, difficulty, selectedSubject, subjects, quizHistory, today, setQuizHistory, setStreak]);

  const handleAnswer = (qi: number, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: parseInt(value) }));
  };

  const handleBookmark = (qi: number) => {
    const q = questions[qi];
    addBookmark({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      bookReference: q.bookReference,
      subjectId: q.subjectId || "physiology",
      userAnswer: answers[qi],
    });
    setBookmarkedQs((prev) => new Set(prev).add(qi));
    toast.success("Question bookmarked! 🔖");
  };

  const handleSaveAsFlashcard = (qi: number) => {
    const q = questions[qi];
    addFlashcard(q.question, q.options[q.correctIndex] + " — " + q.explanation, q.subjectId || "physiology");
    setSavedAsCards((prev) => new Set(prev).add(qi));
    toast.success("Saved as flashcard! 📝");
  };

  const handleExplainMore = async (qi: number) => {
    const q = questions[qi];
    setExplainLoading(qi);
    let result = "";
    const messages: Msg[] = [
      {
        role: "user",
        content: `Explain this dental question in more detail for a student:\n\nQuestion: ${q.question}\nCorrect Answer: ${q.options[q.correctIndex]}\nBrief Explanation: ${q.explanation}\nBook Reference: ${q.bookReference}\n\nPlease give a detailed, student-friendly explanation with clinical relevance.`,
      },
    ];
    try {
      await streamChat({
        messages,
        onDelta: (chunk) => {
          result += chunk;
          setExplanations(prev => ({ ...prev, [qi]: result }));
        },
        onDone: () => setExplainLoading(null),
        onError: (err) => { toast.error(err); setExplainLoading(null); },
      });
    } catch {
      toast.error("Failed to get explanation");
      setExplainLoading(null);
    }
  };

  const handleFollowUp = async (qi: number) => {
    const q = questions[qi];
    const followUpQ = followUpInputs[qi]?.trim();
    if (!followUpQ) return;
    setFollowUpLoading(qi);
    let result = explanations[qi] || "";
    result += "\n\n---\n\n**Follow-up:** " + followUpQ + "\n\n";
    const messages: Msg[] = [
      {
        role: "user",
        content: `Context: Question was "${q.question}", correct answer is "${q.options[q.correctIndex]}", from ${q.bookReference}.\n\nPrevious explanation: ${explanations[qi] || q.explanation}\n\nStudent's follow-up question: ${followUpQ}\n\nAnswer the follow-up concisely.`,
      },
    ];
    let followUpResult = "";
    try {
      await streamChat({
        messages,
        onDelta: (chunk) => {
          followUpResult += chunk;
          setExplanations(prev => ({ ...prev, [qi]: result + followUpResult }));
        },
        onDone: () => { setFollowUpLoading(null); setFollowUpInputs(prev => ({ ...prev, [qi]: "" })); },
        onError: (err) => { toast.error(err); setFollowUpLoading(null); },
      });
    } catch {
      toast.error("Failed to get follow-up answer");
      setFollowUpLoading(null);
    }
  };

  const handleShareQuiz = () => {
    if (questions.length === 0) return;
    const text = questions.map((q, i) =>
      `Q${i + 1}. ${q.question}\n${q.options.map((o, j) => `  ${String.fromCharCode(65 + j)}) ${o}`).join("\n")}`
    ).join("\n\n");
    const full = `🦷 MedicoAI Quiz Challenge!\n\n${text}\n\n---\nTry MedicoAI Learn for AI-powered dental education!`;
    navigator.clipboard.writeText(full);
    toast.success("Quiz copied! Share with friends 📋");
  };

  const handleChallengeLink = () => {
    if (questions.length === 0) return;
    try {
      const challengeData = {
        questions: questions.map(q => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation })),
      };
      const encoded = btoa(JSON.stringify(challengeData));
      const url = `${window.location.origin}/quiz/challenge?d=${encoded}`;
      navigator.clipboard.writeText(url);
      toast.success("Challenge link copied! Send it to a friend 🔗");
    } catch {
      toast.error("Quiz too long to encode as URL");
    }
  };

  const historyChartData = Object.entries(quizHistory)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, entries]) => {
      const arr = Array.isArray(entries) ? entries : [entries];
      const totalScore = arr.reduce((s, e) => s + e.score, 0);
      const totalQ = arr.reduce((s, e) => s + e.total, 0);
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pct: totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0,
        quizzes: arr.length,
      };
    });

  const allHistoryEntries = Object.entries(quizHistory)
    .sort(([a], [b]) => b.localeCompare(a))
    .flatMap(([date, entries]) => {
      const arr = Array.isArray(entries) ? entries : [entries];
      return arr.map((e, i) => ({ ...e, dateKey: date, idx: i }));
    })
    .slice(0, 20);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 animate-page-in">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-sm text-muted-foreground">Generating your quiz...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl relative min-h-[60vh]">
      {!isSubLoading && !hasGoAccess && (
        <UpgradeOverlay featureName="Daily Quiz" requiredPlan="Go" />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Daily Quiz</h2>
          <p className="text-xs text-muted-foreground">Test your knowledge</p>
        </div>
        <div className="flex items-center gap-1.5">
          {submitted && questions.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={handleShareQuiz} className="text-xs">
                <Share2 className="w-3.5 h-3.5 mr-1" /> Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={handleChallengeLink} className="text-xs">
                🔗 Challenge
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="text-xs">
            <History className="w-3.5 h-3.5 mr-1" /> History
          </Button>
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold">{streak}</span>
        </div>
      </div>

      {/* Quiz History Panel */}
      {showHistory && (
        <div className="space-y-3 animate-page-in">
          {historyChartData.length >= 2 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  📊 Score Trend (Last 14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={historyChartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      formatter={(value: number, name: string) => {
                        if (name === "pct") return [`${value}%`, "Avg Score"];
                        return [value, name];
                      }}
                    />
                    <Line type="monotone" dataKey="pct" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Recent Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allHistoryEntries.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No quiz history yet. Take your first quiz!</p>
              )}
              {allHistoryEntries.map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs font-semibold">{entry.subject || "Mixed"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(entry.dateKey).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {entry.difficulty && ` · ${entry.difficulty}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{entry.score}/{entry.total}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.total > 0 ? Math.round((entry.score / entry.total) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz Setup Form */}
      {questions.length === 0 && !loading && !showHistory && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">🎲 Random Mix</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Topic (optional — for targeted quiz)</label>
              <Input placeholder="e.g., Enamel formation, TMJ..." value={customTopic} onChange={e => setCustomTopic(e.target.value)} className="text-sm" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {TOPIC_SUGGESTIONS.slice(0, 4).map(t => (
                  <Badge key={t} variant="outline" className="text-[10px] cursor-pointer hover:bg-muted" onClick={() => setCustomTopic(t)}>{t}</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Number of Questions</label>
              <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n} questions</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Difficulty</label>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <Button key={d} size="sm" variant={difficulty === d ? "default" : "outline"} onClick={() => setDifficulty(d)}
                    className={difficulty === d ? "gradient-teal text-secondary-foreground" : ""}>
                    {d === "easy" && <Zap className="w-3.5 h-3.5 mr-1" />}
                    {d === "medium" && <BookOpen className="w-3.5 h-3.5 mr-1" />}
                    {d === "hard" && <Brain className="w-3.5 h-3.5 mr-1" />}
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                <Timer className="w-3 h-3 inline mr-0.5" />
                {TIMER_SECONDS[difficulty]}s per question
              </p>
            </div>
            <Button onClick={loadQuiz} className="w-full gradient-teal text-secondary-foreground font-semibold">
              Generate Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Quiz - Timer + Question Navigation */}
      {questions.length > 0 && !submitted && (
        <>
          {/* Timer bar */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold">Question {currentQuestion + 1} of {questions.length}</span>
                <div className={`flex items-center gap-1 text-xs font-bold ${timeLeft <= 10 ? "text-destructive animate-pulse" : "text-foreground"}`}>
                  <Timer className="w-3.5 h-3.5" />
                  {timeLeft}s
                </div>
              </div>
              <Progress value={(timeLeft / totalTime) * 100} className="h-1.5" />
              {/* Question dots */}
              <div className="flex gap-1 mt-2 flex-wrap">
                {questions.map((_, qi) => (
                  <button
                    key={qi}
                    onClick={() => setCurrentQuestion(qi)}
                    className={`w-7 h-7 rounded-full text-[10px] font-bold border transition-colors ${
                      qi === currentQuestion
                        ? "bg-primary text-primary-foreground border-primary"
                        : answers[qi] !== undefined
                        ? "bg-secondary/20 border-secondary text-secondary-foreground"
                        : timedOut.has(qi)
                        ? "bg-destructive/20 border-destructive text-destructive"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {qi + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Question */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold leading-relaxed">
                Q{currentQuestion + 1}. {questions[currentQuestion].question}
              </CardTitle>
              {timedOut.has(currentQuestion) && (
                <Badge variant="destructive" className="text-[10px] w-fit">⏱ Time's up!</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <RadioGroup
                value={answers[currentQuestion]?.toString()}
                onValueChange={(v) => handleAnswer(currentQuestion, v)}
                disabled={timedOut.has(currentQuestion)}
              >
                {questions[currentQuestion].options.map((opt, oi) => (
                  <div key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                    timedOut.has(currentQuestion) ? "opacity-50 border-border" : "border-border hover:border-primary/50"
                  }`}>
                    <RadioGroupItem value={oi.toString()} id={`q${currentQuestion}-o${oi}`} />
                    <Label htmlFor={`q${currentQuestion}-o${oi}`} className="text-sm cursor-pointer flex-1">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={goToPrev} disabled={currentQuestion === 0} className="flex-1">
                  ← Previous
                </Button>
                {currentQuestion < questions.length - 1 ? (
                  <Button size="sm" onClick={goToNext} className="flex-1 gradient-teal text-secondary-foreground">
                    Next →
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleSubmit} className="flex-1 gradient-teal text-secondary-foreground font-semibold">
                    Submit Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Results */}
      {submitted && (
        <Card className="border-none shadow-sm animate-scale-in">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            <div>
              <p className="font-bold">Score: {score}/{questions.length}</p>
              <p className="text-xs text-muted-foreground">
                {score === questions.length ? "Perfect! 🌟" : score >= questions.length * 0.6 ? "Good job! 👏" : "Keep studying! 💪"}
                {timedOut.size > 0 && ` · ${timedOut.size} timed out`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {submitted && (
        <Button variant="outline" className="w-full" onClick={() => { setQuestions([]); setSubmitted(false); setAnswers({}); setTimedOut(new Set()); }}>
          Take Another Quiz
        </Button>
      )}

      {submitted && <QuickActions context="quiz" />}

      {/* Show all questions with answers after submit */}
      {submitted && questions.map((q, qi) => (
        <Card key={qi} className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold leading-relaxed">
              Q{qi + 1}. {q.question}
              {timedOut.has(qi) && <Badge variant="destructive" className="text-[10px] ml-2">⏱ Timed out</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup value={answers[qi]?.toString()} disabled>
              {q.options.map((opt, oi) => {
                const isCorrect = oi === q.correctIndex;
                const isWrong = answers[qi] === oi && oi !== q.correctIndex;
                return (
                  <div key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isCorrect ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700" : isWrong ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700" : "border-border"}`}>
                    <RadioGroupItem value={oi.toString()} id={`r${qi}-o${oi}`} />
                    <Label htmlFor={`r${qi}-o${oi}`} className="text-sm cursor-pointer flex-1">{opt}</Label>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    {isWrong && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                );
              })}
            </RadioGroup>

            <div className="space-y-2">
              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="text-xs text-foreground">{q.explanation}</p>
                <Badge variant="secondary" className="text-[10px]">📖 {q.bookReference}</Badge>
              </div>

              {!explanations[qi] && explainLoading !== qi && (
                <Button size="sm" variant="ghost" className="text-xs w-full" onClick={() => handleExplainMore(qi)}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> Explain More (AI)
                </Button>
              )}
              {explainLoading === qi && !explanations[qi] && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs text-muted-foreground">Getting detailed explanation...</span>
                </div>
              )}
              {explanations[qi] && (
                <div className="space-y-2">
                  <div className="bg-card border border-border rounded-lg p-3 prose prose-sm max-w-none text-xs">
                    <ReactMarkdown>{explanations[qi]}</ReactMarkdown>
                  </div>
                  {!followUpOpen[qi] && (
                    <Button size="sm" variant="ghost" className="text-xs w-full" onClick={() => setFollowUpOpen(prev => ({ ...prev, [qi]: true }))}>
                      Still confused? Ask a follow-up
                    </Button>
                  )}
                  {followUpOpen[qi] && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask a follow-up..."
                        value={followUpInputs[qi] || ""}
                        onChange={(e) => setFollowUpInputs(prev => ({ ...prev, [qi]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleFollowUp(qi)}
                        className="text-xs h-8"
                        disabled={followUpLoading === qi}
                      />
                      <Button size="sm" onClick={() => handleFollowUp(qi)} disabled={followUpLoading === qi || !followUpInputs[qi]?.trim()} className="h-8">
                        {followUpLoading === qi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {answers[qi] !== q.correctIndex && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBookmark(qi)} disabled={bookmarkedQs.has(qi)} className="text-xs flex-1">
                    <Bookmark className={`w-3 h-3 mr-1 ${bookmarkedQs.has(qi) ? "fill-current" : ""}`} />
                    {bookmarkedQs.has(qi) ? "Bookmarked" : "Bookmark"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSaveAsFlashcard(qi)} disabled={savedAsCards.has(qi)} className="text-xs flex-1">
                    {savedAsCards.has(qi) ? "✅ Saved" : "📝 Flashcard"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DailyQuiz;
