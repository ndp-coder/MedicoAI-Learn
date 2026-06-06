import { useState, useMemo } from "react";
import { Plus, Trash2, GraduationCap, FileText, Filter, Award, TrendingDown, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { getTestMarks, addTestMark, deleteTestMark, type TestMark } from "@/lib/testMarks";
import { toast } from "sonner";
import MarksCharts from "@/components/MarksCharts";

const TEST_TYPES = [
  { value: "internal", label: "Internal" },
  { value: "viva", label: "Viva" },
  { value: "practical", label: "Practical" },
  { value: "other", label: "Other" },
] as const;

const GRADE_POINTS: Record<string, number> = {
  "90": 10, "80": 9, "70": 8, "60": 7, "50": 6, "40": 5, "0": 0,
};

function getGradePoint(pct: number): number {
  if (pct >= 90) return 10;
  if (pct >= 80) return 9;
  if (pct >= 70) return 8;
  if (pct >= 60) return 7;
  if (pct >= 50) return 6;
  if (pct >= 40) return 5;
  return 0;
}

function getGrade(pct: number): string {
  if (pct >= 90) return "O";
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "B+";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  return "F";
}

const TestMarksPage = () => {
  const subjects = useUserSubjects();
  const [marks, setMarks] = useState<TestMark[]>(() => getTestMarks());
  const [showAdd, setShowAdd] = useState(false);
  const [filterSubject, setFilterSubject] = useState("all");
  const [passCutoff] = useState(50);
  const [showGPA, setShowGPA] = useState(false);

  // Form state
  const [subjectId, setSubjectId] = useState("");
  const [testName, setTestName] = useState("");
  const [testType, setTestType] = useState<TestMark["testType"]>("internal");
  const [marksObtained, setMarksObtained] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [facultyName, setFacultyName] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [remarks, setRemarks] = useState("");

  const filteredMarks = useMemo(() => {
    const sorted = [...marks].sort((a, b) => b.date.localeCompare(a.date));
    if (filterSubject === "all") return sorted;
    return sorted.filter((m) => m.subjectId === filterSubject);
  }, [marks, filterSubject]);

  // Subject analytics
  const subjectAnalytics = useMemo(() => {
    const grouped: Record<string, { marks: TestMark[]; avg: number }> = {};
    marks.forEach(m => {
      if (!grouped[m.subjectId]) grouped[m.subjectId] = { marks: [], avg: 0 };
      grouped[m.subjectId].marks.push(m);
    });
    Object.keys(grouped).forEach(id => {
      const g = grouped[id];
      g.avg = Math.round(g.marks.reduce((s, m) => s + (m.marksObtained / m.totalMarks) * 100, 0) / g.marks.length);
    });
    const sorted = Object.entries(grouped).sort((a, b) => b[1].avg - a[1].avg);
    return {
      best: sorted[0] ? { id: sorted[0][0], avg: sorted[0][1].avg } : null,
      worst: sorted.length > 1 ? { id: sorted[sorted.length - 1][0], avg: sorted[sorted.length - 1][1].avg } : null,
      all: grouped,
    };
  }, [marks]);

  // GPA calculation
  const gpa = useMemo(() => {
    if (marks.length === 0) return 0;
    const totalGP = marks.reduce((s, m) => s + getGradePoint((m.marksObtained / m.totalMarks) * 100), 0);
    return (totalGP / marks.length).toFixed(2);
  }, [marks]);

  const resetForm = () => {
    setSubjectId("");
    setTestName("");
    setTestType("internal");
    setMarksObtained("");
    setTotalMarks("");
    setFacultyName("");
    setDate(new Date());
    setRemarks("");
  };

  const handleAdd = () => {
    if (!subjectId || !testName.trim() || !marksObtained || !totalMarks || !date) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const obtained = parseFloat(marksObtained);
    const total = parseFloat(totalMarks);
    if (isNaN(obtained) || isNaN(total) || obtained < 0 || total <= 0 || obtained > total) {
      toast.error("Please enter valid marks.");
      return;
    }

    addTestMark({
      subjectId,
      testName: testName.trim(),
      testType,
      marksObtained: obtained,
      totalMarks: total,
      facultyName: facultyName.trim(),
      date: date.toISOString().split("T")[0],
      remarks: remarks.trim().slice(0, 500),
    });
    setMarks(getTestMarks());
    setShowAdd(false);
    resetForm();
    toast.success("Test marks added! 📝");
  };

  const handleDelete = (id: string) => {
    deleteTestMark(id);
    setMarks(getTestMarks());
    toast.success("Marks deleted");
  };

  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const getPct = (m: TestMark) => Math.round((m.marksObtained / m.totalMarks) * 100);
  const getPctColor = (pct: number) => {
    if (pct >= 75) return "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30";
    if (pct >= 50) return "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30";
    return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30";
  };

  const overallAvg = marks.length > 0
    ? Math.round(marks.reduce((s, m) => s + (m.marksObtained / m.totalMarks) * 100, 0) / marks.length)
    : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Test Marks</h2>
          <p className="text-xs text-muted-foreground">
            {marks.length} test{marks.length !== 1 ? "s" : ""} recorded
            {marks.length > 0 && ` · Avg: ${overallAvg}%`}
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-teal text-secondary-foreground font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Marks
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Test Marks</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-semibold mb-1 block">Subject *</label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Test Name *</label>
                <Input placeholder="e.g., Unit Test 1, Mid Semester" value={testName} onChange={(e) => setTestName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Test Type *</label>
                <Select value={testType} onValueChange={(v) => setTestType(v as TestMark["testType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Marks Obtained *</label>
                  <Input type="number" min="0" placeholder="e.g., 35" value={marksObtained} onChange={(e) => setMarksObtained(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Total Marks *</label>
                  <Input type="number" min="1" placeholder="e.g., 50" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Faculty Name</label>
                <Input placeholder="e.g., Dr. Sharma" value={facultyName} onChange={(e) => setFacultyName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Date *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Remarks</label>
                <Input placeholder="Optional notes..." value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={500} />
              </div>
              <Button onClick={handleAdd} className="w-full gradient-teal text-secondary-foreground font-semibold">
                <Plus className="w-4 h-4 mr-1" /> Save Marks
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* GPA & Subject Badges */}
      {marks.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-none shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold">{gpa}</p>
                <p className="text-[10px] text-muted-foreground">GPA (10-point)</p>
              </CardContent>
            </Card>
            {subjectAnalytics.best && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-3 text-center">
                  <Award className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[10px] font-semibold truncate">{getSubjectName(subjectAnalytics.best.id).split(" ")[0]}</p>
                  <p className="text-[9px] text-muted-foreground">Best · {subjectAnalytics.best.avg}%</p>
                </CardContent>
              </Card>
            )}
            {subjectAnalytics.worst && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-3 text-center">
                  <TrendingDown className="w-4 h-4 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                  <p className="text-[10px] font-semibold truncate">{getSubjectName(subjectAnalytics.worst.id).split(" ")[0]}</p>
                  <p className="text-[9px] text-muted-foreground">Needs Work · {subjectAnalytics.worst.avg}%</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Filter */}
      {marks.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Charts */}
      <MarksCharts marks={marks} />

      {/* Marks List */}
      {filteredMarks.length > 0 ? (
        <div className="space-y-2.5">
          {filteredMarks.map((m) => {
            const pct = getPct(m);
            const pctClass = getPctColor(pct);
            const passed = pct >= passCutoff;
            const grade = getGrade(pct);
            return (
              <Card key={m.id} className="border-none shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{m.testName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {getSubjectName(m.subjectId)} · {format(new Date(m.date), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Badge className={`text-xs ${pctClass} border-none`}>
                        {pct}%
                      </Badge>
                      <Badge variant={passed ? "secondary" : "destructive"} className="text-[10px]">
                        {grade}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold">
                      {m.marksObtained}<span className="text-sm font-normal text-muted-foreground">/{m.totalMarks}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px]">{m.testType}</Badge>
                    {!passed && <Badge variant="destructive" className="text-[9px]">Below Cutoff</Badge>}
                    {m.facultyName && (
                      <span className="text-[10px] text-muted-foreground">
                        <GraduationCap className="w-3 h-3 inline mr-0.5" />{m.facultyName}
                      </span>
                    )}
                  </div>
                  {m.remarks && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 italic">📝 {m.remarks}</p>
                  )}
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="sm" className="text-destructive h-6 text-[10px]" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="w-3 h-3 mr-0.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-bold mb-1">No marks recorded</h3>
          <p className="text-sm text-muted-foreground">
            {filterSubject !== "all" ? "No marks for this subject. Try another filter." : "Tap 'Add Marks' to record your test scores."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TestMarksPage;
