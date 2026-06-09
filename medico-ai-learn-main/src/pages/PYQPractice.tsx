import { useState } from "react";
import { Loader2, FileText, Clock, Eye, EyeOff, Trophy, RotateCcw, ChevronDown, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeOverlay } from "@/components/UpgradeOverlay";

interface PYQQuestion {
  question: string;
  marks: number;
  questionType: "short_answer" | "short_essay" | "long_essay";
  modelAnswer: string;
  keyPoints: string[];
}

interface PYQPaper {
  paperTitle: string;
  totalMarks: number;
  duration: string;
  questions: PYQQuestion[];
}

const PYQPractice = () => {
  const { canAccess, loading: isSubLoading } = useSubscription();
  const hasProAccess = canAccess("pro");
  const subjects = useUserSubjects();
  const [subjectId, setSubjectId] = useState("");
  const [yearStyle, setYearStyle] = useState("BDS 1st Year");
  const [marksType, setMarksType] = useState("mixed");
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState<PYQPaper | null>(null);
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [studentAnswers, setStudentAnswers] = useState<Record<number, string>>({});
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const handleGenerate = async () => {
    if (!subjectId) { toast.error("Select a subject"); return; }
    setLoading(true);
    setPaper(null);
    setShowAnswers({});
    setStudentAnswers({});

    try {
      const { data, error } = await supabase.functions.invoke("generate-pyq", {
        body: { subjectId, yearStyle, marksType },
      });
      if (error) throw error;
      if (data?.questions) {
        setPaper(data);
        logActivity("quiz");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate paper");
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (i: number) => {
    setShowAnswers(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const showAllAnswers = () => {
    if (!paper) return;
    const all: Record<number, boolean> = {};
    paper.questions.forEach((_, i) => { all[i] = true; });
    setShowAnswers(all);
  };

  const typeLabel = (t: string) =>
    t === "short_answer" ? "Short Answer" : t === "short_essay" ? "Short Essay" : "Long Essay";

  const typeColor = (t: string) =>
    t === "short_answer" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" :
    t === "short_essay" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
    "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";

  if (!paper) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
        <div>
          <h2 className="text-lg font-bold">📝 PYQ Practice</h2>
          <p className="text-xs text-muted-foreground">AI-generated university-style exam papers</p>
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
              <label className="text-xs font-semibold mb-1.5 block">Year</label>
              <Select value={yearStyle} onValueChange={setYearStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BDS 1st Year", "BDS 2nd Year", "BDS 3rd Year", "BDS 4th Year"].map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block">Question Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "mixed", label: "Mixed Paper" },
                  { val: "2mark", label: "2 Mark Qs" },
                  { val: "5mark", label: "5 Mark Qs" },
                  { val: "10mark", label: "10 Mark Qs" },
                ].map(({ val, label }) => (
                  <Button key={val} size="sm" variant={marksType === val ? "default" : "outline"}
                    onClick={() => setMarksType(val)}
                    className={marksType === val ? "gradient-teal text-secondary-foreground" : ""}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleGenerate} disabled={loading || !subjectId} className="w-full gradient-teal text-secondary-foreground font-semibold">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><FileText className="w-4 h-4 mr-2" /> Generate Paper</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in relative min-h-[60vh]">
      {!isSubLoading && !hasProAccess && <UpgradeOverlay featureName="PYQ Practice" requiredPlan="Pro" />}
      
      {/* Paper header */}
      <Card className="border-none shadow-sm gradient-dental text-primary-foreground">
        <CardContent className="p-4">
          <h2 className="text-sm font-bold">{paper.paperTitle}</h2>
          <div className="flex gap-3 mt-2 text-xs opacity-80">
            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {paper.totalMarks} marks</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {paper.duration}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={showAllAnswers} className="text-xs">
          <Eye className="w-3.5 h-3.5 mr-1" /> Show All Answers
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setPaper(null); }} className="text-xs ml-auto">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> New Paper
        </Button>
      </div>

      {/* Questions */}
      {paper.questions.map((q, i) => (
        <Card key={i} className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`text-[10px] ${typeColor(q.questionType)}`}>
                {typeLabel(q.questionType)}
              </Badge>
              <Badge variant="outline" className="text-[10px]">{q.marks} marks</Badge>
            </div>
            <CardTitle className="text-sm font-semibold leading-relaxed">
              Q{i + 1}. {q.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Student answer area */}
            <Textarea
              placeholder="Write your answer here (optional)..."
              value={studentAnswers[i] || ""}
              onChange={e => setStudentAnswers(prev => ({ ...prev, [i]: e.target.value }))}
              rows={q.marks >= 10 ? 8 : q.marks >= 5 ? 5 : 3}
              className="text-xs"
            />

            {/* Key points hint */}
            <p className="text-[10px] text-muted-foreground">
              💡 Cover {q.keyPoints.length} key points for full marks
            </p>

            {/* Toggle answer */}
            <Collapsible open={showAnswers[i]} onOpenChange={() => toggleAnswer(i)}>
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost" className="w-full text-xs">
                  {showAnswers[i] ? <><EyeOff className="w-3.5 h-3.5 mr-1" /> Hide Answer</> : <><Eye className="w-3.5 h-3.5 mr-1" /> View Model Answer</>}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2">
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 prose prose-sm max-w-none text-xs">
                    <ReactMarkdown>{q.modelAnswer}</ReactMarkdown>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-secondary" /> Key Points:
                    </p>
                    <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside">
                      {q.keyPoints.map((p, j) => <li key={j}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PYQPractice;
