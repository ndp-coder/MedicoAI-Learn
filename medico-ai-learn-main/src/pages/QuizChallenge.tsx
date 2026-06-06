import { useState, useEffect } from "react";
import { Trophy, CheckCircle2, XCircle, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ChallengeQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QuizChallenge = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const data = searchParams.get("d");
    if (!data) { setError("No quiz data found"); return; }
    try {
      const decoded = JSON.parse(atob(data));
      if (decoded?.questions?.length) {
        setQuestions(decoded.questions);
      } else {
        setError("Invalid quiz data");
      }
    } catch {
      setError("Failed to decode quiz");
    }
  }, [searchParams]);

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Answer all questions first");
      return;
    }
    setSubmitted(true);
  };

  const score = submitted
    ? questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center animate-page-in">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => navigate("/quiz")}>Go to Quiz</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">🏆 Quiz Challenge</h2>
          <p className="text-xs text-muted-foreground">A friend challenged you!</p>
        </div>
      </div>

      {submitted && (
        <Card className="border-none shadow-sm animate-scale-in gradient-dental text-primary-foreground">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="font-bold">Score: {score}/{questions.length}</p>
              <p className="text-xs opacity-80">
                {score === questions.length ? "Perfect! 🌟" : score >= 3 ? "Nice work! 👏" : "Keep studying! 💪"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {questions.map((q, qi) => (
        <Card key={qi} className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold leading-relaxed">
              Q{qi + 1}. {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[qi]?.toString()}
              onValueChange={v => !submitted && setAnswers(prev => ({ ...prev, [qi]: parseInt(v) }))}
              disabled={submitted}
            >
              {q.options.map((opt, oi) => {
                const isCorrect = submitted && oi === q.correctIndex;
                const isWrong = submitted && answers[qi] === oi && oi !== q.correctIndex;
                return (
                  <div key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isCorrect ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700" : isWrong ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700" : "border-border"}`}>
                    <RadioGroupItem value={oi.toString()} id={`cq${qi}-o${oi}`} />
                    <Label htmlFor={`cq${qi}-o${oi}`} className="text-sm cursor-pointer flex-1">{opt}</Label>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    {isWrong && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                );
              })}
            </RadioGroup>
            {submitted && q.explanation && (
              <div className="bg-muted rounded-lg p-3 mt-2">
                <p className="text-xs">{q.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {questions.length > 0 && !submitted && (
        <Button onClick={handleSubmit} className="w-full gradient-teal text-secondary-foreground font-semibold">
          Submit Answers
        </Button>
      )}

      {submitted && (
        <Button variant="outline" onClick={() => navigate("/quiz")} className="w-full">
          Try Your Own Quiz
        </Button>
      )}
    </div>
  );
};

export default QuizChallenge;
