import { useState, useMemo } from "react";
import { Bookmark, Trash2, Filter, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getBookmarks, removeBookmark, type BookmarkedQuestion } from "@/lib/bookmarks";
import { allSubjects, getActiveSubjects } from "@/lib/subjects";
import { toast } from "sonner";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>(getBookmarks());
  const [filterSubject, setFilterSubject] = useState("all");
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const filtered = useMemo(() => {
    if (filterSubject === "all") return bookmarks;
    return bookmarks.filter((b) => b.subjectId === filterSubject);
  }, [bookmarks, filterSubject]);

  const handleDelete = (id: string) => {
    removeBookmark(id);
    setBookmarks(getBookmarks());
    toast.success("Bookmark removed");
  };

  const currentPractice = filtered[practiceIndex];

  const handlePracticeSubmit = () => {
    setShowAnswer(true);
  };

  const handleNext = () => {
    setPracticeAnswer(null);
    setShowAnswer(false);
    if (practiceIndex < filtered.length - 1) {
      setPracticeIndex(practiceIndex + 1);
    } else {
      setPracticeMode(false);
      setPracticeIndex(0);
      toast.success("Practice session complete! 🎉");
    }
  };

  const getSubjectName = (id: string) => allSubjects.find((s) => s.id === id)?.name ?? id;

  if (bookmarks.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
          <Bookmark className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-1">No Bookmarks Yet</h2>
        <p className="text-sm text-muted-foreground">
          Bookmark wrong answers from quizzes to practice them later!
        </p>
      </div>
    );
  }

  if (practiceMode && currentPractice) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Practice Mode</h2>
          <Button size="sm" variant="outline" onClick={() => { setPracticeMode(false); setPracticeIndex(0); }}>
            Exit
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{practiceIndex + 1} / {filtered.length}</p>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold leading-relaxed">
              {currentPractice.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup value={practiceAnswer?.toString()} onValueChange={(v) => !showAnswer && setPracticeAnswer(parseInt(v))} disabled={showAnswer}>
              {currentPractice.options.map((opt, oi) => {
                const isCorrect = showAnswer && oi === currentPractice.correctIndex;
                const isWrong = showAnswer && practiceAnswer === oi && oi !== currentPractice.correctIndex;
                return (
                  <div key={oi} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isCorrect ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700" : isWrong ? "border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-700" : "border-border"}`}>
                    <RadioGroupItem value={oi.toString()} id={`p-o${oi}`} />
                    <Label htmlFor={`p-o${oi}`} className="text-sm cursor-pointer flex-1">{opt}</Label>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isWrong && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                );
              })}
            </RadioGroup>

            {showAnswer && (
              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="text-xs">{currentPractice.explanation}</p>
                <Badge variant="secondary" className="text-[10px]">📖 {currentPractice.bookReference}</Badge>
              </div>
            )}

            {!showAnswer ? (
              <Button onClick={handlePracticeSubmit} disabled={practiceAnswer === null} className="w-full gradient-teal text-secondary-foreground font-semibold">
                Check Answer
              </Button>
            ) : (
              <Button onClick={handleNext} className="w-full gradient-teal text-secondary-foreground font-semibold">
                {practiceIndex < filtered.length - 1 ? "Next Question →" : "Finish Practice"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Bookmarked Questions</h2>
          <p className="text-xs text-muted-foreground">{bookmarks.length} saved questions</p>
        </div>
        {filtered.length > 0 && (
          <Button size="sm" onClick={() => { setPracticeMode(true); setPracticeIndex(0); }} className="gradient-teal text-secondary-foreground font-semibold">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Practice
          </Button>
        )}
      </div>

      <Select value={filterSubject} onValueChange={setFilterSubject}>
        <SelectTrigger className="w-full">
          <Filter className="w-3.5 h-3.5 mr-2" />
          <SelectValue placeholder="Filter by subject" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subjects</SelectItem>
          {getActiveSubjects().map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-3">
        {filtered.map((b) => (
          <Card key={b.id} className="border-none shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-relaxed mb-1">{b.question}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{getSubjectName(b.subjectId)}</Badge>
                    <Badge variant="outline" className="text-[10px]">📖 {b.bookReference}</Badge>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive shrink-0 h-8 w-8" onClick={() => handleDelete(b.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Bookmarks;
