import { useState } from "react";
import { Loader2, Mic, Send, CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";
import { logMistake } from "@/lib/mistakeLog";
import { awardXP } from "@/lib/gamification";
import { QuickActions } from "@/components/QuickActions";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface VivaQuestion {
  question: string;
  expectedPoints: string[];
  difficulty: "basic" | "moderate" | "advanced";
  questionType: string;
}

interface Evaluation {
  score: number;
  feedback: string;
  idealAnswer: string;
  keyPointsMissed: string[];
}

type Difficulty = "easy" | "medium" | "hard";

const VivaPractice = () => {
  const subjects = useUserSubjects();
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<VivaQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<number, Evaluation>>({});
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [sessionDone, setSessionDone] = useState(false);

  const handleStart = async () => {
    if (!subjectId) { toast.error("Select a subject"); return; }
    setLoading(true);
    setQuestions([]);
    setCurrentQ(0);
    setAnswer("");
    setEvaluations({});
    setSkipped(new Set());
    setSessionDone(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-viva", {
        body: { subjectId, difficulty },
      });
      if (error) throw error;
      if (data?.questions) {
        setQuestions(data.questions);
        logActivity("quiz");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate viva questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) { toast.error("Type your answer first"); return; }
    setEvaluating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-viva", {
        body: {
          mode: "evaluate",
          subjectId,
          question: questions[currentQ].question,
          studentAnswer: answer.trim(),
        },
      });
      if (error) throw error;
      setEvaluations(prev => ({ ...prev, [currentQ]: data }));
    } catch (e) {
      console.error(e);
      toast.error("Failed to evaluate answer");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(i => i + 1);
      setAnswer("");
    } else {
      setSessionDone(true);
      const xpResult = awardXP("viva", avgScore / 100);
      toast.success(`+${xpResult.xp} XP earned! ⚡`);
      if (xpResult.leveledUp && xpResult.newLevel) {
        toast.success(`🎉 Level up! ${xpResult.newLevel.emoji} ${xpResult.newLevel.name}!`);
      }
    }
  };

  const handleSkip = () => {
    setSkipped(prev => new Set(prev).add(currentQ));
    handleNext();
  };

  const totalScore = Object.values(evaluations).reduce((s, e) => s + e.score, 0);
  const maxScore = Object.keys(evaluations).length * 10;
  const avgScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const diffBadgeColor = (d: string) =>
    d === "basic" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" :
    d === "advanced" ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";

  // Session complete view
  if (sessionDone) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 animate-page-in space-y-5">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl gradient-dental flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-1">Viva Complete! 🎉</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You scored <span className="font-bold text-foreground">{totalScore}/{maxScore}</span> ({avgScore}%)
          </p>
          <div className="flex gap-3 justify-center mb-6">
            <Badge variant="secondary">{Object.keys(evaluations).length} answered</Badge>
            <Badge variant="outline">{skipped.size} skipped</Badge>
          </div>
        </div>

        {/* Review all */}
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Collapsible key={i}>
              <Card className="border-none shadow-sm">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${evaluations[i] ? (evaluations[i].score >= 7 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : evaluations[i].score >= 4 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400") : "bg-muted text-muted-foreground"}`}>
                      {evaluations[i] ? evaluations[i].score : "–"}
                    </div>
                    <p className="text-xs font-medium text-left flex-1 truncate">{q.question}</p>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    {evaluations[i] ? (
                      <div className="space-y-2 text-xs">
                        <div className="bg-muted rounded-lg p-2">
                          <p className="font-semibold mb-1">Feedback:</p>
                          <p className="text-muted-foreground">{evaluations[i].feedback}</p>
                        </div>
                        {evaluations[i].keyPointsMissed.length > 0 && (
                          <div>
                            <p className="font-semibold mb-1">Missed points:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                              {evaluations[i].keyPointsMissed.map((p, j) => <li key={j}>{p}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Skipped</p>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        <QuickActions context="viva" />

        <Button onClick={handleStart} className="w-full gradient-teal text-secondary-foreground font-semibold">
          <RotateCcw className="w-4 h-4 mr-2" /> New Viva Session
        </Button>
      </div>
    );
  }

  // Setup view
  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
        <div>
          <h2 className="text-lg font-bold">🎤 Viva Practice</h2>
          <p className="text-xs text-muted-foreground">Simulate an oral exam — AI evaluates your answers</p>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Subject</label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Difficulty</label>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                  <Button key={d} size="sm" variant={difficulty === d ? "default" : "outline"} onClick={() => setDifficulty(d)}
                    className={difficulty === d ? "gradient-teal text-secondary-foreground" : ""}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={handleStart} disabled={loading || !subjectId} className="w-full gradient-teal text-secondary-foreground font-semibold">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Preparing...</> : <><Mic className="w-4 h-4 mr-2" /> Start Viva</>}
            </Button>
          </CardContent>
        </Card>

        <div className="bg-muted rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold">How it works</h3>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>AI examiner asks you questions one at a time</li>
            <li>Type your answer as you would in a real viva</li>
            <li>AI evaluates your answer and gives feedback</li>
            <li>Get a scorecard at the end with strengths & weaknesses</li>
          </ol>
        </div>
      </div>
    );
  }

  // Active viva
  const q = questions[currentQ];
  const hasEval = !!evaluations[currentQ];

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Viva Practice</h2>
          <p className="text-xs text-muted-foreground">
            {subjects.find(s => s.id === subjectId)?.name}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {currentQ + 1}/{questions.length}
        </Badge>
      </div>

      <Progress value={((currentQ + 1) / questions.length) * 100} className="h-1.5" />

      {/* Question card */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`text-[10px] ${diffBadgeColor(q.difficulty)}`}>{q.difficulty}</Badge>
            <Badge variant="outline" className="text-[10px]">{q.questionType}</Badge>
          </div>
          <CardTitle className="text-sm font-bold leading-relaxed">
            {q.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasEval ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Type your answer here... Answer as you would in a real viva."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={5}
                disabled={evaluating}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmitAnswer} disabled={evaluating || !answer.trim()} className="flex-1 gradient-teal text-secondary-foreground font-semibold">
                  {evaluating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating...</> : <><Send className="w-4 h-4 mr-2" /> Submit Answer</>}
                </Button>
                {"webkitSpeechRecognition" in window || "SpeechRecognition" in window ? (
                  <Button variant="outline" onClick={() => {
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    const recognition = new SpeechRecognition();
                    recognition.lang = "en-US";
                    recognition.continuous = false;
                    recognition.onresult = (event: any) => {
                      const transcript = event.results[0][0].transcript;
                      setAnswer(prev => prev ? prev + " " + transcript : transcript);
                    };
                    recognition.onerror = () => toast.error("Voice input failed");
                    recognition.start();
                    toast.info("🎙️ Listening...");
                  }} disabled={evaluating}>
                    <Mic className="w-4 h-4" />
                  </Button>
                ) : null}
                <Button variant="outline" onClick={handleSkip} disabled={evaluating}>
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-slide-up">
              {/* Score */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${evaluations[currentQ].score >= 7 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : evaluations[currentQ].score >= 4 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"}`}>
                  {evaluations[currentQ].score}/10
                </div>
                <div>
                  <p className="text-sm font-bold">
                    {evaluations[currentQ].score >= 8 ? "Excellent! 🌟" : evaluations[currentQ].score >= 6 ? "Good! 👍" : evaluations[currentQ].score >= 4 ? "Fair — room to improve" : "Needs work 💪"}
                  </p>
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-muted rounded-lg p-3 text-xs prose prose-sm max-w-none">
                <ReactMarkdown>{evaluations[currentQ].feedback}</ReactMarkdown>
              </div>

              {/* Missed points */}
              {evaluations[currentQ].keyPointsMissed.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-red-500" /> Points you missed:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                    {evaluations[currentQ].keyPointsMissed.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {/* Ideal answer */}
              <Collapsible>
                <CollapsibleTrigger className="text-xs font-semibold text-secondary flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> View ideal answer
                  <ChevronDown className="w-3 h-3" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-card border border-border rounded-lg p-3 mt-2 text-xs prose prose-sm max-w-none">
                    <ReactMarkdown>{evaluations[currentQ].idealAnswer}</ReactMarkdown>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button onClick={handleNext} className="w-full gradient-teal text-secondary-foreground font-semibold">
                {currentQ < questions.length - 1 ? <><ArrowRight className="w-4 h-4 mr-2" /> Next Question</> : <><Trophy className="w-4 h-4 mr-2" /> View Results</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VivaPractice;
