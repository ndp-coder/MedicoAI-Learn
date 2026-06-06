import { useState } from "react";
import { Loader2, Stethoscope, Send, Trophy, ChevronDown, AlertCircle, Lightbulb, RotateCcw, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";
import { QuickActions } from "@/components/QuickActions";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface CaseData {
  title: string;
  patientInfo: { age: number; gender: string; occupation: string };
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  pastDentalHistory: string;
  clinicalFindings: string[];
  investigations: string[];
  radiographicFindings: string;
  questions: { question: string; hint: string }[];
  category: string;
}

interface Evaluation {
  diagnosisScore: number;
  treatmentScore: number;
  overallScore: number;
  diagnosisFeedback: string;
  treatmentFeedback: string;
  correctDiagnosis: string;
  idealTreatment: string;
  missedPoints: string[];
  clinicalPearl: string;
}

type Difficulty = "easy" | "medium" | "hard";

const CaseStudy = () => {
  const subjects = useUserSubjects();
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setCaseData(null);
    setEvaluation(null);
    setDiagnosis("");
    setTreatment("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-case-study", {
        body: { subjectId, difficulty },
      });
      if (error) throw error;
      setCaseData(data);
      logActivity("quiz");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate case study");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim() || !treatment.trim()) {
      toast.error("Please provide both diagnosis and treatment plan");
      return;
    }
    setEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-case-study", {
        body: { mode: "evaluate", caseData, studentDiagnosis: diagnosis, studentTreatment: treatment },
      });
      if (error) throw error;
      setEvaluation(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to evaluate");
    } finally {
      setEvaluating(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 7 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" :
    score >= 4 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
    "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";

  if (!caseData && !loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
        <div>
          <h2 className="text-lg font-bold">🏥 Clinical Case Study</h2>
          <p className="text-xs text-muted-foreground">Diagnose and treat AI-generated clinical cases</p>
        </div>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Focus Area (optional)</label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Any area" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
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
            <Button onClick={handleGenerate} className="w-full gradient-teal text-secondary-foreground font-semibold">
              <Stethoscope className="w-4 h-4 mr-2" /> Generate Case
            </Button>
          </CardContent>
        </Card>
        <div className="bg-muted rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-bold">How it works</h3>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>AI generates a realistic clinical dental case</li>
            <li>Read the patient history, findings, and investigations</li>
            <li>Write your diagnosis and treatment plan</li>
            <li>AI evaluates your clinical reasoning</li>
          </ol>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 animate-page-in">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        <p className="text-sm text-muted-foreground">Preparing clinical case...</p>
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Clinical Case</h2>
          <p className="text-xs text-muted-foreground">{caseData.title}</p>
        </div>
        <Badge variant="secondary" className="text-[10px]">{caseData.category}</Badge>
      </div>

      {/* Patient Info */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-secondary" /> Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p><span className="font-semibold">Age:</span> {caseData.patientInfo.age} | <span className="font-semibold">Gender:</span> {caseData.patientInfo.gender} | <span className="font-semibold">Occupation:</span> {caseData.patientInfo.occupation}</p>
          <p><span className="font-semibold">Chief Complaint:</span> {caseData.chiefComplaint}</p>
          <p><span className="font-semibold">History:</span> {caseData.historyOfPresentIllness}</p>
          <p><span className="font-semibold">Medical History:</span> {caseData.pastMedicalHistory}</p>
          <p><span className="font-semibold">Dental History:</span> {caseData.pastDentalHistory}</p>
        </CardContent>
      </Card>

      {/* Clinical Findings */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-secondary" /> Clinical Findings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
            {caseData.clinicalFindings.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
          <p className="text-xs mt-2"><span className="font-semibold">Radiographic:</span> {caseData.radiographicFindings}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {caseData.investigations.map((inv, i) => <Badge key={i} variant="outline" className="text-[10px]">{inv}</Badge>)}
          </div>
        </CardContent>
      </Card>

      {/* Guiding Questions */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs w-full">
            <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" /> View guiding questions <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 mt-2">
            {caseData.questions.map((q, i) => (
              <div key={i} className="bg-muted rounded-lg p-2.5 text-xs">
                <p className="font-medium">{q.question}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">💡 Hint: {q.hint}</p>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Student Response */}
      {!evaluation && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Your Diagnosis</label>
              <Textarea placeholder="What is your diagnosis? Include differential diagnoses if applicable..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3} className="text-sm" disabled={evaluating} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block">Treatment Plan</label>
              <Textarea placeholder="Outline your step-by-step treatment plan..." value={treatment} onChange={e => setTreatment(e.target.value)} rows={4} className="text-sm" disabled={evaluating} />
            </div>
            <Button onClick={handleSubmit} disabled={evaluating || !diagnosis.trim() || !treatment.trim()} className="w-full gradient-teal text-secondary-foreground font-semibold">
              {evaluating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating...</> : <><Send className="w-4 h-4 mr-2" /> Submit for Evaluation</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Evaluation */}
      {evaluation && (
        <div className="space-y-4 animate-slide-up">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ${scoreColor(evaluation.overallScore)}`}>
                  {evaluation.overallScore}/10
                </div>
                <div>
                  <p className="text-sm font-bold">{evaluation.overallScore >= 7 ? "Excellent Clinical Reasoning! 🌟" : evaluation.overallScore >= 4 ? "Good effort! 👍" : "Needs more study 💪"}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={`text-[10px] ${scoreColor(evaluation.diagnosisScore)}`}>Dx: {evaluation.diagnosisScore}/10</Badge>
                    <Badge className={`text-[10px] ${scoreColor(evaluation.treatmentScore)}`}>Tx: {evaluation.treatmentScore}/10</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-muted rounded-lg p-3">
                  <p className="font-semibold mb-1">Diagnosis Feedback</p>
                  <p className="text-muted-foreground">{evaluation.diagnosisFeedback}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="font-semibold mb-1">Treatment Feedback</p>
                  <p className="text-muted-foreground">{evaluation.treatmentFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs w-full">
                View Ideal Answer <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="border-none shadow-sm mt-2">
                <CardContent className="p-3 text-xs space-y-2">
                  <p><span className="font-semibold">Correct Diagnosis:</span> {evaluation.correctDiagnosis}</p>
                  <p><span className="font-semibold">Ideal Treatment:</span> {evaluation.idealTreatment}</p>
                  {evaluation.missedPoints.length > 0 && (
                    <div>
                      <p className="font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-500" /> Missed:</p>
                      <ul className="list-disc list-inside text-muted-foreground">{evaluation.missedPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <Card className="border-none shadow-sm border-l-4 border-l-amber-400">
            <CardContent className="p-3 flex gap-2 text-xs">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Clinical Pearl</p>
                <p className="text-muted-foreground">{evaluation.clinicalPearl}</p>
              </div>
            </CardContent>
          </Card>

          <QuickActions context="case-study" />

          <Button onClick={() => { setCaseData(null); setEvaluation(null); setDiagnosis(""); setTreatment(""); }} className="w-full gradient-teal text-secondary-foreground font-semibold">
            <RotateCcw className="w-4 h-4 mr-2" /> New Case Study
          </Button>
        </div>
      )}
    </div>
  );
};

export default CaseStudy;
