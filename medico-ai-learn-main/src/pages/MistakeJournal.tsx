import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle2, XCircle, RotateCcw, Brain, Trash2, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllMistakes, getMistakeStats, getPracticeMistakes, logCorrectRetry, clearMistakes, type Mistake } from "@/lib/mistakeLog";
import { addFlashcard } from "@/lib/flashcards";
import { awardXP } from "@/lib/gamification";
import { allSubjects, getActiveSubjects } from "@/lib/subjects";
import { QuickActions } from "@/components/QuickActions";
import { toast } from "sonner";
import { ExplainMistakeButton } from "@/components/ExplainMistakeButton";

const MistakeJournal = () => {
  const [mistakes, setMistakes] = useState(getAllMistakes());
  const [filterSubject, setFilterSubject] = useState("all");
  const [practicing, setPracticing] = useState(false);
  const [practiceQs, setPracticeQs] = useState<Mistake[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [practiceResults, setPracticeResults] = useState<Record<number, boolean>>({});

  const stats = useMemo(() => getMistakeStats(), [mistakes]);

  const filtered = useMemo(() => {
    if (filterSubject === "all") return mistakes;
    return mistakes.filter(m => m.subjectId === filterSubject);
  }, [mistakes, filterSubject]);

  const getSubjectName = (id: string) => allSubjects.find(s => s.id === id)?.name ?? id;

  const startPractice = () => {
    const qs = getPracticeMistakes(filterSubject === "all" ? undefined : filterSubject);
    if (qs.length === 0) { toast.error("No mistakes to practice"); return; }
    setPracticeQs(qs);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setPracticeResults({});
    setPracticing(true);
  };

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    const correct = idx === practiceQs[currentQ].correctIndex;
    setPracticeResults(prev => ({ ...prev, [currentQ]: correct }));
    if (correct) {
      logCorrectRetry(practiceQs[currentQ].question);
    }
  };

  const handleNext = () => {
    if (currentQ < practiceQs.length - 1) {
      setCurrentQ(i => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      const correct = Object.values(practiceResults).filter(Boolean).length;
      awardXP("quiz", correct / practiceQs.length);
      toast.success(`Practice done! ${correct}/${practiceQs.length} correct`);
      setPracticing(false);
      setMistakes(getAllMistakes());
    }
  };

  const handleClear = () => {
    clearMistakes();
    setMistakes([]);
    toast.success("Mistake log cleared");
  };

  const handleConvertToFlashcard = (m: Mistake) => {
    const term = m.question;
    const definition = `✅ ${m.options[m.correctIndex]}\n\n💡 ${m.explanation}`;
    addFlashcard(term, definition, m.subjectId);
    toast.success("Converted to flashcard! 📝");
  };

  const handleConvertAll = () => {
    let count = 0;
    filtered.forEach(m => {
      const term = m.question;
      const definition = `✅ ${m.options[m.correctIndex]}\n\n💡 ${m.explanation}`;
      const card = addFlashcard(term, definition, m.subjectId);
      if (card) count++;
    });
    toast.success(`${count} mistakes converted to flashcards! 📝`);
  };

  // Practice mode
  if (practicing && practiceQs.length > 0) {
    const q = practiceQs[currentQ];
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{currentQ + 1}/{practiceQs.length}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setPracticing(false)}>Exit</Button>
        </div>
        <Progress value={((currentQ + 1) / practiceQs.length) * 100} className="h-1.5" />
        
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px]">{getSubjectName(q.subjectId)}</Badge>
              <Badge variant="destructive" className="text-[10px]">Wrong {q.timesWrong}x</Badge>
              {q.timesCorrectAfter > 0 && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Fixed {q.timesCorrectAfter}x</Badge>}
            </div>
            <CardTitle className="text-sm font-bold leading-relaxed">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt, oi) => {
              const isCorrect = answered && oi === q.correctIndex;
              const isWrong = answered && selectedAnswer === oi && oi !== q.correctIndex;
              return (
                <button key={oi} onClick={() => handleAnswer(oi)} disabled={answered}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    isCorrect ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700 font-semibold" :
                    isWrong ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700" :
                    answered ? "border-border opacity-50" : "border-border hover:border-secondary cursor-pointer"
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
                  {currentQ < practiceQs.length - 1 ? "Next →" : "Finish"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">📝 Mistake Journal</h2>
          <p className="text-xs text-muted-foreground">{stats.total} mistakes logged</p>
        </div>
        <div className="flex gap-1">
          {filtered.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={handleConvertAll}>
              <Layers className="w-3.5 h-3.5 mr-1" /> All → Cards
            </Button>
          )}
          {mistakes.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={handleClear}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 text-center">
              <AlertTriangle className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <p className="text-sm font-bold">{stats.total}</p>
              <p className="text-[9px] text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
              <p className="text-sm font-bold">{stats.improved}</p>
              <p className="text-[9px] text-muted-foreground">Improved</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-3 text-center">
              <XCircle className="w-4 h-4 mx-auto text-red-500 mb-1" />
              <p className="text-sm font-bold">{stats.persistent}</p>
              <p className="text-[9px] text-muted-foreground">Persistent</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter + Practice */}
      <div className="flex gap-2">
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="flex-1 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {getActiveSubjects().map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={startPractice} disabled={filtered.length === 0} className="gradient-teal text-secondary-foreground font-semibold text-xs">
          <Brain className="w-3.5 h-3.5 mr-1" /> Practice
        </Button>
      </div>

      {/* Mistake list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No mistakes logged yet. Take quizzes and drills to track mistakes!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <Card key={m.id} className="border-none shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${m.timesCorrectAfter > 0 ? "bg-emerald-100 dark:bg-emerald-950/30" : "bg-red-100 dark:bg-red-950/30"}`}>
                    {m.timesCorrectAfter > 0 ? <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-3 h-3 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-relaxed">{m.question}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px]">{getSubjectName(m.subjectId)}</Badge>
                      <Badge variant="destructive" className="text-[9px]">Wrong {m.timesWrong}x</Badge>
                      {m.timesCorrectAfter > 0 && <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Fixed {m.timesCorrectAfter}x</Badge>}
                      <Badge variant="secondary" className="text-[9px]">{m.source}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">✅ {m.options[m.correctIndex]}</p>
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 mt-1" onClick={() => handleConvertToFlashcard(m)}>
                        <Layers className="w-3 h-3 mr-1" /> Save as Flashcard
                      </Button>
                      <ExplainMistakeButton mistake={m} subjectName={getSubjectName(m.subjectId)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MistakeJournal;
