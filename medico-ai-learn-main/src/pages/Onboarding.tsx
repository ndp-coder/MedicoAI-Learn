import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Stethoscope, Sparkles, Check } from "lucide-react";
import {
  type Course,
  getSubjectsForCourse,
  setCurrentCourse,
  setSelectedSubjectIds,
} from "@/lib/subjects";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import medicoAiLogo from "@/assets/medicoai-logo.png";

const YEARS: Array<{ value: string; year: 1 | 2 | 3 | 4; label: string }> = [
  { value: "Year 1", year: 1, label: "Year 1" },
  { value: "Year 2", year: 2, label: "Year 2" },
  { value: "Year 3", year: 3, label: "Year 3" },
  { value: "Final Year", year: 4, label: "Final Year" },
  { value: "Intern", year: 4, label: "Intern / House Surgeon" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [course, setCourse] = useState<Course | null>(null);
  const [year, setYear] = useState<typeof YEARS[number] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const yearSubjects = useMemo(() => {
    if (!course || !year) return [];
    return getSubjectsForCourse(course).filter(s => s.year === year.year);
  }, [course, year]);

  const toggleSubject = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!course) return toast.error("Pick your course to continue");
      setStep(2);
    } else if (step === 2) {
      if (!year) return toast.error("Pick your year of study");
      // Pre-select every subject for this year by default
      setSelected(new Set(yearSubjects.map(s => s.id)));
      setStep(3);
    }
  };

  const handleFinish = async () => {
    if (!course || !year) return;
    if (selected.size === 0) return toast.error("Pick at least one subject");

    setSaving(true);
    try {
      // Save to localStorage first so the app works offline
      setCurrentCourse(course);
      localStorage.setItem("dentai-year", JSON.stringify(year.value));
      setSelectedSubjectIds(Array.from(selected));

      // Also persist student_name from auth metadata to localStorage
      const studentName = user?.user_metadata?.student_name || "";
      if (studentName) {
        localStorage.setItem("dentai-student-name", JSON.stringify(studentName));
      }

      // Save to Supabase so data persists across devices/browsers
      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            course,
            year_of_study: year.value,
            selected_subject_ids: Array.from(selected),
            onboarded_at: new Date().toISOString(),
            student_name: studentName,
          })
          .eq("id", user.id);

        if (error) {
          console.error("Onboarding DB save error:", error);
          // Fallback: try upsert in case profile row doesn't exist
          const { error: upsertError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              course,
              year_of_study: year.value,
              selected_subject_ids: Array.from(selected),
              onboarded_at: new Date().toISOString(),
              student_name: studentName,
            });
          if (upsertError) {
            console.error("Onboarding DB upsert error:", upsertError);
          }
        }
      }

      toast.success(`Welcome to MedicoAI Learn — ${course.toUpperCase()} ${year.label}!`);
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Couldn't save your preferences. They'll stay on this device.");
      navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <img src={medicoAiLogo} alt="MedicoAI Learn logo" width={64} height={64} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Set up your MedicoAI Learn</h1>
          <p className="text-sm text-muted-foreground mt-1">A 30-second setup tailors every feature to your curriculum.</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className={`h-2 rounded-full transition-all ${
                step === n ? "w-8 bg-primary" : step > n ? "w-2 bg-primary" : "w-2 bg-muted"
              }`}
              aria-label={`Step ${n} ${step === n ? "current" : step > n ? "completed" : "upcoming"}`}
            />
          ))}
        </div>

        <Card className="border shadow-lg">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg">Which course are you studying?</CardTitle>
                <CardDescription>You can switch this anytime from Settings.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["mbbs", "bds"] as Course[]).map(c => {
                  const isActive = course === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCourse(c)}
                      className={`text-left rounded-xl border-2 p-5 transition-all ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Stethoscope className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        {isActive && <Check className="w-5 h-5 text-primary" />}
                      </div>
                      <div className="mt-3 text-lg font-bold">{c.toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {c === "mbbs"
                          ? "Bachelor of Medicine, Bachelor of Surgery"
                          : "Bachelor of Dental Surgery"}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg">Which year are you in?</CardTitle>
                <CardDescription>We'll show you subjects from your year first.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {YEARS.map(y => {
                  const isActive = year?.value === y.value;
                  return (
                    <button
                      key={y.value}
                      onClick={() => setYear(y)}
                      className={`rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {y.label}
                    </button>
                  );
                })}
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Pick your subjects
                </CardTitle>
                <CardDescription>
                  {course?.toUpperCase()} · {year?.label} — {selected.size} of {yearSubjects.length} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[50vh] overflow-y-auto">
                {yearSubjects.length === 0 && (
                  <p className="text-sm text-muted-foreground">No subjects configured for this year yet.</p>
                )}
                {yearSubjects.map(s => {
                  const isOn = selected.has(s.id);
                  const Icon = s.icon;
                  return (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        isOn ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox checked={isOn} onCheckedChange={() => toggleSubject(s.id)} className="mt-0.5" />
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${s.bgColor}`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold leading-tight">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{s.book} — {s.author}</div>
                      </div>
                    </label>
                  );
                })}
              </CardContent>
            </>
          )}
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep(s => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={handleNext} className="px-6">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving} className="px-6">
              {saving ? "Saving..." : "Start studying"}
            </Button>
          )}
        </div>

        {step === 1 && course && (
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              {course === "mbbs" ? "🩺 MBBS curriculum (NMC CBME)" : "🦷 BDS curriculum (DCI)"}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
