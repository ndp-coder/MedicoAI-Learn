import { useState } from "react";
import { Trophy, CheckCircle2, XCircle, Sparkles, Flame, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getTodayChallenge,
  getChallengeResult,
  saveChallengeResult,
  getChallengeStreak,
} from "@/lib/dailyChallenge";
import { awardXP } from "@/lib/gamification";
import { toast } from "sonner";

const DailyChallenge = () => {
  const challenge = getTodayChallenge();
  const existing = getChallengeResult(challenge.date);

  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(!!existing);
  const [streak] = useState(getChallengeStreak());

  const q = challenge.questions[currentQ];
  const totalQs = challenge.questions.length;

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === q.correctIndex;
    setResults((r) => [...r, isCorrect]);
  };

  const handleNext = () => {
    if (currentQ < totalQs - 1) {
      setCurrentQ((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const score = results.filter(Boolean).length;
      // 2x XP for daily challenge
      const result = awardXP("quiz", (score / totalQs) * 2);
      saveChallengeResult({
        date: challenge.date,
        score,
        total: totalQs,
        completedAt: new Date().toISOString(),
      });
      toast.success(`Challenge complete! +${result.xp} XP (2× bonus) 🏆`);
      if (result.leveledUp && result.newLevel) {
        toast.success(`Level up! ${result.newLevel.emoji} ${result.newLevel.name}`);
      }
      setFinished(true);
    }
  };

  // Already completed today
  if (finished && existing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl gradient-dental flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Today's Challenge Complete!</h2>
          <p className="text-xs text-muted-foreground mt-1">Come back tomorrow for a new challenge.</p>
        </div>

        <Card className="border-none shadow-md">
          <CardContent className="p-5 text-center">
            <p className="text-4xl font-bold gradient-dental bg-clip-text text-transparent">
              {existing.score}/{existing.total}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Today's score</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">{streak}-day streak</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Just finished now
  if (finished) {
    const score = results.filter(Boolean).length;
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Challenge Complete!</h2>
        </div>
        <Card className="border-none shadow-md">
          <CardContent className="p-5 text-center space-y-2">
            <p className="text-4xl font-bold">
              {score}/{totalQs}
            </p>
            <Badge className="gradient-dental text-primary-foreground">2× XP earned</Badge>
            <div className="pt-2 flex items-center justify-center gap-2 text-sm">
              <Flame className="w-4 h-4 text-orange-500" />
              {streak + 1}-day streak
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not started yet
  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl gradient-dental flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Daily Challenge</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {totalQs} curated questions · same for everyone today
          </p>
        </div>

        <Card className="border-none shadow-md">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Reward</p>
                <p className="text-sm font-bold">2× XP bonus 🏆</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="text-sm font-bold flex items-center gap-1 justify-end">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  {streak} days
                </p>
              </div>
            </div>
            <Button
              onClick={() => setStarted(true)}
              className="w-full gradient-dental text-primary-foreground font-semibold"
            >
              Start Today's Challenge <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground">
          Challenge resets at midnight. Same questions for every user today.
        </p>
      </div>
    );
  }

  // In quiz
  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {currentQ + 1}/{totalQs}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {q.subject}
        </Badge>
      </div>
      <Progress value={((currentQ + 1) / totalQs) * 100} className="h-1.5" />

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-bold leading-relaxed">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {q.options.map((opt, oi) => {
            const isCorrect = answered && oi === q.correctIndex;
            const isWrong = answered && selected === oi && oi !== q.correctIndex;
            return (
              <button
                key={oi}
                onClick={() => handleAnswer(oi)}
                disabled={answered}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                  isCorrect
                    ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700 font-semibold"
                    : isWrong
                      ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700"
                      : answered
                        ? "border-border opacity-50"
                        : "border-border hover:border-secondary cursor-pointer"
                }`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                {opt}
                {isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline ml-2" />
                )}
                {isWrong && <XCircle className="w-4 h-4 text-red-500 inline ml-2" />}
              </button>
            );
          })}
          {answered && (
            <div className="space-y-2 animate-slide-up">
              <p className="text-[10px] text-muted-foreground px-1">💡 {q.explanation}</p>
              <Button
                onClick={handleNext}
                size="sm"
                className="w-full gradient-dental text-primary-foreground font-semibold"
              >
                {currentQ < totalQs - 1 ? "Next →" : "Finish & Earn XP"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyChallenge;
