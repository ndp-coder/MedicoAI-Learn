import { useState } from "react";
import { Send, Loader2, BookOpen, Lightbulb, ListChecks, HelpCircle, Star, Plus, Check, Copy, Clock, Brain, CheckCircle2, XCircle, Wand2, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackTopicReview } from "@/lib/progressTracker";
import { addFlashcard } from "@/lib/flashcards";
import { logActivity } from "@/lib/activityLog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { streamChat, type Msg } from "@/lib/stream";
import ReactMarkdown from "react-markdown";

interface RecapData {
  summary: string[];
  keyTerms: string[];
  practiceQuestions: { question: string; answer: string }[];
  quickTip: string;
  bookReference: string;
}

interface RecapQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface RecentTopic {
  topic: string;
  subjectId: string;
  date: string;
}

const TopicRecap = () => {
  const subjects = useUserSubjects();
  const [topic, setTopic] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [savedTerms, setSavedTerms] = useState<Set<string>>(new Set());
  const [recentTopics, setRecentTopics] = useLocalStorage<RecentTopic[]>("dentai-recent-topics", []);

  // Quiz Me state
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<RecapQuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Mnemonics state
  const [mnemonicsLoading, setMnemonicsLoading] = useState(false);
  const [mnemonics, setMnemonics] = useState("");

  // Cross-links state
  const [crossLinks, setCrossLinks] = useState("");
  const [crossLinksLoading, setCrossLinksLoading] = useState(false);

  const handleGenerate = async (topicOverride?: string, subjectOverride?: string) => {
    const t = topicOverride || topic;
    const s = subjectOverride || subjectId;
    if (!t.trim() || !s) {
      toast.error("Please enter a topic and select a subject.");
      return;
    }

    const subject = subjects.find((sub) => sub.id === s);
    if (!subject) return;

    setLoading(true);
    setRecap(null);
    setSavedTerms(new Set());
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setMnemonics("");
    setCrossLinks("");
    setTopic(t);
    setSubjectId(s);

    try {
      const { data, error } = await supabase.functions.invoke("generate-recap", {
        body: { topic: t.trim(), subject: subject.book },
      });
      if (error) throw error;
      if (data?.recap) {
        setRecap(data.recap);
        trackTopicReview(s, t.trim());
        logActivity("recap");
        const updated = [{ topic: t.trim(), subjectId: s, date: new Date().toISOString() }, ...recentTopics.filter(r => r.topic !== t.trim())].slice(0, 10);
        setRecentTopics(updated);
      }
    } catch (e) {
      console.error("Recap error:", e);
      toast.error("Failed to generate recap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerm = (term: string) => {
    if (!subjectId || !recap) return;
    const definition = `Key term from "${topic}" — ${recap.bookReference}`;
    addFlashcard(term, definition, subjectId);
    setSavedTerms((prev) => new Set(prev).add(term));
    toast.success(`"${term}" saved as flashcard!`);
  };

  const handleSaveAllTerms = () => {
    if (!recap || !subjectId) return;
    recap.keyTerms.forEach((term) => {
      if (!savedTerms.has(term)) {
        const definition = `Key term from "${topic}" — ${recap.bookReference}`;
        addFlashcard(term, definition, subjectId);
      }
    });
    setSavedTerms(new Set(recap.keyTerms));
    toast.success("All key terms saved as flashcards!");
  };

  const handleCopyRecap = () => {
    if (!recap) return;
    const text = [
      `📚 Topic Recap: ${topic}`,
      "",
      "Summary:",
      ...recap.summary.map(s => `• ${s}`),
      "",
      "Key Terms: " + recap.keyTerms.join(", "),
      "",
      "Practice Questions:",
      ...recap.practiceQuestions.map((pq, i) => `Q${i + 1}. ${pq.question}\nA: ${pq.answer}`),
      "",
      `💡 Tip: ${recap.quickTip}`,
      `📖 ${recap.bookReference}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Recap copied to clipboard! 📋");
  };

  const handleQuizMe = async () => {
    if (!recap) return;
    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-recap-quiz", {
        body: {
          topic,
          summary: recap.summary,
          keyTerms: recap.keyTerms,
          bookReference: recap.bookReference,
        },
      });
      if (error) throw error;
      if (data?.questions) {
        setQuizQuestions(data.questions);
      }
    } catch (e) {
      console.error("Recap quiz error:", e);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleGenerateMnemonics = async () => {
    if (!recap) return;
    setMnemonicsLoading(true);
    let result = "";
    const messages: Msg[] = [{
      role: "user",
      content: `Create memorable mnemonics for these dental key terms from "${topic}":\n\n${recap.keyTerms.join(", ")}\n\nMake them fun, catchy, and easy to remember. Use first-letter mnemonics, rhymes, or visual associations. Format with markdown.`,
    }];
    try {
      await streamChat({
        messages,
        onDelta: (chunk) => { result += chunk; setMnemonics(result); },
        onDone: () => setMnemonicsLoading(false),
        onError: (err) => { toast.error(err); setMnemonicsLoading(false); },
      });
    } catch { toast.error("Failed to generate mnemonics"); setMnemonicsLoading(false); }
  };

  const handleCrossLinks = async () => {
    if (!recap) return;
    setCrossLinksLoading(true);
    let result = "";
    const currentSubject = subjects.find(s => s.id === subjectId)?.name;
    const otherSubjects = subjects.filter(s => s.id !== subjectId).map(s => s.name).join(", ");
    const messages: Msg[] = [{
      role: "user",
      content: `Topic: "${topic}" from ${currentSubject}\n\nIdentify related topics from these OTHER dental subjects: ${otherSubjects}\n\nFor each related topic, explain the connection in 1-2 sentences. Format as:\n**Subject — Topic**: Connection explanation\n\nList 3-5 cross-references.`,
    }];
    try {
      await streamChat({
        messages,
        onDelta: (chunk) => { result += chunk; setCrossLinks(result); },
        onDone: () => setCrossLinksLoading(false),
        onError: (err) => { toast.error(err); setCrossLinksLoading(false); },
      });
    } catch { toast.error("Failed"); setCrossLinksLoading(false); }
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      toast.error("Answer all questions first");
      return;
    }
    setQuizSubmitted(true);
  };

  const quizScore = quizSubmitted
    ? quizQuestions.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correctIndex ? 1 : 0), 0)
    : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
      <div>
        <h2 className="text-lg font-bold">Topic Recap</h2>
        <p className="text-xs text-muted-foreground">Tell us what you studied — we'll make it stick!</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1.5 block">I studied this topic:</label>
            <Input placeholder="e.g., Enamel formation, TMJ anatomy..." value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerate()} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">From this subject:</label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name} — {s.author}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => handleGenerate()} disabled={loading || !topic.trim() || !subjectId} className="w-full gradient-teal text-secondary-foreground font-semibold">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>) : (<><Send className="w-4 h-4 mr-2" />Generate Recap</>)}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Topics */}
      {!recap && !loading && recentTopics.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Recent Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentTopics.slice(0, 6).map((rt, i) => (
              <Badge key={i} variant="outline" className="text-xs cursor-pointer hover:bg-muted transition-colors" onClick={() => handleGenerate(rt.topic, rt.subjectId)}>
                {rt.topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {recap && (
        <div className="space-y-4 animate-slide-up">
          {/* Copy & Quiz Me buttons */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={handleQuizMe} disabled={quizLoading} className="text-xs">
              {quizLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Brain className="w-3.5 h-3.5 mr-1" />}
              Quiz Me
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerateMnemonics} disabled={mnemonicsLoading} className="text-xs">
              {mnemonicsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
              Mnemonics
            </Button>
            <Button size="sm" variant="outline" onClick={handleCrossLinks} disabled={crossLinksLoading} className="text-xs">
              {crossLinksLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Link2 className="w-3.5 h-3.5 mr-1" />}
              Related Topics
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCopyRecap} className="text-xs">
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy
            </Button>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-secondary" /> Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {recap.summary.map((point, i) => (
                <p key={i} className="text-sm flex items-start gap-2">
                  <span className="text-secondary font-bold mt-0.5">•</span>{point}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-secondary" /> Key Terms
                </CardTitle>
                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={handleSaveAllTerms}>
                  <Plus className="w-3 h-3 mr-1" /> Save All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recap.keyTerms.map((term, i) => (
                  <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:opacity-80 transition-opacity gap-1" onClick={() => !savedTerms.has(term) && handleSaveTerm(term)}>
                    {savedTerms.has(term) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {term}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Tap a term to save as flashcard</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-secondary" /> Practice Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recap.practiceQuestions.map((pq, i) => (
                <div key={i} className="bg-muted rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium">Q{i + 1}. {pq.question}</p>
                  <p className="text-xs text-muted-foreground">💡 {pq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Inline Quiz */}
          {quizQuestions.length > 0 && (
            <Card className="border-none shadow-sm border-l-4 border-l-secondary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-secondary" /> Quick Quiz
                  {quizSubmitted && (
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {quizScore}/{quizQuestions.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quizQuestions.map((q, qi) => (
                  <div key={qi} className="space-y-2">
                    <p className="text-sm font-medium">Q{qi + 1}. {q.question}</p>
                    <RadioGroup
                      value={quizAnswers[qi]?.toString()}
                      onValueChange={(v) => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [qi]: parseInt(v) }))}
                      disabled={quizSubmitted}
                    >
                      {q.options.map((opt, oi) => {
                        const isCorrect = quizSubmitted && oi === q.correctIndex;
                        const isWrong = quizSubmitted && quizAnswers[qi] === oi && oi !== q.correctIndex;
                        return (
                          <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${isCorrect ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700" : isWrong ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700" : "border-border"}`}>
                            <RadioGroupItem value={oi.toString()} id={`rq${qi}-o${oi}`} />
                            <Label htmlFor={`rq${qi}-o${oi}`} className="text-xs cursor-pointer flex-1">{opt}</Label>
                            {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                            {isWrong && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                        );
                      })}
                    </RadioGroup>
                    {quizSubmitted && q.explanation && (
                      <p className="text-[10px] text-muted-foreground px-2">💡 {q.explanation}</p>
                    )}
                  </div>
                ))}
                {!quizSubmitted && (
                  <Button size="sm" onClick={handleSubmitQuiz} className="w-full gradient-teal text-secondary-foreground font-semibold">
                    Check Answers
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-sm border-l-4 border-l-secondary">
            <CardContent className="p-4 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold mb-1">Quick Memorization Tip</p>
                <p className="text-sm text-muted-foreground">{recap.quickTip}</p>
              </div>
            </CardContent>
          </Card>

          {/* Mnemonics */}
          {mnemonics && (
            <Card className="border-none shadow-sm border-l-4 border-l-amber-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-500" /> Mnemonics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-xs">
                  <ReactMarkdown>{mnemonics}</ReactMarkdown>
                </div>
                <Button size="sm" variant="ghost" className="text-xs mt-2" onClick={() => {
                  addFlashcard(`Mnemonics: ${topic}`, mnemonics, subjectId);
                  toast.success("Mnemonics saved as flashcard! 📝");
                }}>
                  <Plus className="w-3 h-3 mr-1" /> Save as Flashcard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cross-subject links */}
          {crossLinks && (
            <Card className="border-none shadow-sm border-l-4 border-l-blue-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-500" /> Related Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-xs">
                  <ReactMarkdown>{crossLinks}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Badge variant="outline" className="text-[10px]">📖 Reference: {recap.bookReference}</Badge>
          </div>
        </div>
      )}

      {!recap && !loading && recentTopics.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <Star className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Enter a topic to get a personalized study recap</p>
        </div>
      )}
    </div>
  );
};

export default TopicRecap;
