import { useState } from "react";
import { Stethoscope, ArrowLeft, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CLINICAL_CASES, type ClinicalCase } from "@/lib/clinicalCases";
import { supabase } from "@/integrations/supabase/client";
import { awardXP } from "@/lib/gamification";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const ClinicalCases = () => {
  const [active, setActive] = useState<ClinicalCase | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [showModel, setShowModel] = useState<Record<number, boolean>>({});

  const evaluate = async (qIdx: number) => {
    if (!active) return;
    const userAnswer = answers[qIdx]?.trim();
    if (!userAnswer || userAnswer.length < 10) {
      toast.error("Please write a more detailed answer first");
      return;
    }
    setLoading((l) => ({ ...l, [qIdx]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("ai-helper", {
        body: {
          action: "evaluate-case",
          scenario: active.scenario,
          question: active.questions[qIdx].prompt,
          modelAnswer: active.questions[qIdx].modelAnswer,
          userAnswer,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFeedback((f) => ({ ...f, [qIdx]: data.content }));
      const result = awardXP("caseStudy", 0.5);
      toast.success(`Evaluation ready! +${result.xp} XP`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to evaluate";
      toast.error(msg);
    } finally {
      setLoading((l) => ({ ...l, [qIdx]: false }));
    }
  };

  if (active) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
        <Button variant="ghost" size="sm" onClick={() => { setActive(null); setAnswers({}); setFeedback({}); setShowModel({}); }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to cases
        </Button>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{active.subject}</Badge>
              <Badge variant="secondary" className="text-[10px] capitalize">{active.difficulty}</Badge>
            </div>
            <CardTitle className="text-base font-bold">{active.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs leading-relaxed">{active.scenario}</p>
            </div>
          </CardContent>
        </Card>

        {active.questions.map((q, qIdx) => (
          <Card key={qIdx} className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                Q{qIdx + 1}. {q.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                placeholder="Write your answer here..."
                value={answers[qIdx] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [qIdx]: e.target.value }))}
                rows={4}
                className="text-xs"
                disabled={!!feedback[qIdx]}
              />
              {!feedback[qIdx] && (
                <Button
                  onClick={() => evaluate(qIdx)}
                  disabled={loading[qIdx]}
                  size="sm"
                  className="w-full gradient-dental text-primary-foreground font-semibold"
                >
                  {loading[qIdx] ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Evaluating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> AI Evaluate
                    </>
                  )}
                </Button>
              )}
              {feedback[qIdx] && (
                <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/30 prose prose-sm dark:prose-invert max-w-none text-xs">
                  <ReactMarkdown>{feedback[qIdx]}</ReactMarkdown>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] w-full justify-start"
                onClick={() => setShowModel((s) => ({ ...s, [qIdx]: !s[qIdx] }))}
              >
                <ChevronRight className={`w-3 h-3 mr-1 transition-transform ${showModel[qIdx] ? "rotate-90" : ""}`} />
                {showModel[qIdx] ? "Hide" : "Show"} model answer
              </Button>
              {showModel[qIdx] && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    📚 Model Answer
                  </p>
                  <p className="text-xs leading-relaxed">{q.modelAnswer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
      <div>
        <h1 className="text-lg font-bold">🩺 Clinical Cases</h1>
        <p className="text-xs text-muted-foreground">
          Real-world scenarios · AI-evaluated answers
        </p>
      </div>

      <div className="space-y-2">
        {CLINICAL_CASES.map((c) => (
          <Card
            key={c.id}
            className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => { setActive(c); setAnswers({}); setFeedback({}); setShowModel({}); }}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-dental flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Badge variant="outline" className="text-[9px]">{c.subject}</Badge>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] capitalize ${
                      c.difficulty === "easy"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : c.difficulty === "medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                    }`}
                  >
                    {c.difficulty}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {c.questions.length} Qs
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClinicalCases;
