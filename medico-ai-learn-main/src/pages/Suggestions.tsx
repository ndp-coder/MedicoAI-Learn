import { useState, useMemo } from "react";
import { Lightbulb, Youtube, TrendingDown, AlertTriangle, CheckCircle2, Search, BookOpen, FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getProgress } from "@/lib/progressTracker";
import { getTestMarks } from "@/lib/testMarks";
import { useUserSubjects } from "@/hooks/useUserSubjects";

interface WeakSubject {
  subjectId: string;
  name: string;
  source: "quiz" | "test" | "both";
  quizAccuracy?: number;
  testAverage?: number;
  overallScore: number;
  details: string;
  searchTopics: string[];
}

const Suggestions = () => {
  const subjects = useUserSubjects();
  const [customSearch, setCustomSearch] = useState("");
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const weakSubjects = useMemo(() => {
    const progress = getProgress();
    const testMarks = getTestMarks();
    const weakMap: Record<string, WeakSubject> = {};

    subjects.forEach((subject) => {
      const p = progress[subject.id];
      const quizAccuracy =
        p && p.questionsAttempted > 0
          ? Math.round((p.questionsCorrect / p.questionsAttempted) * 100)
          : null;

      const subjectMarks = testMarks.filter((m) => m.subjectId === subject.id);
      const testAverage =
        subjectMarks.length > 0
          ? Math.round(
              subjectMarks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) /
                subjectMarks.length
            )
          : null;

      const isQuizWeak = quizAccuracy !== null && quizAccuracy < 70;
      const isTestWeak = testAverage !== null && testAverage < 70;

      if (isQuizWeak || isTestWeak) {
        const source: "quiz" | "test" | "both" =
          isQuizWeak && isTestWeak ? "both" : isQuizWeak ? "quiz" : "test";

        const scores = [quizAccuracy, testAverage].filter((s) => s !== null) as number[];
        const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        let details = "";
        if (isQuizWeak && isTestWeak) {
          details = `Quiz: ${quizAccuracy}% · Test avg: ${testAverage}%`;
        } else if (isQuizWeak) {
          details = `Quiz accuracy: ${quizAccuracy}%`;
        } else {
          details = `Test average: ${testAverage}%`;
        }

        const searchTopics = [
          `${subject.name} dental lecture`,
          `${subject.book} important topics`,
          `${subject.name} BDS 1st year revision`,
        ];

        subjectMarks
          .filter((m) => (m.marksObtained / m.totalMarks) * 100 < 60)
          .slice(0, 2)
          .forEach((m) => {
            searchTopics.push(`${m.testName} ${subject.name} explanation`);
          });

        weakMap[subject.id] = {
          subjectId: subject.id,
          name: subject.name,
          source,
          quizAccuracy: quizAccuracy ?? undefined,
          testAverage: testAverage ?? undefined,
          overallScore,
          details,
          searchTopics,
        };
      }
    });

    return Object.values(weakMap).sort((a, b) => a.overallScore - b.overallScore);
  }, []);

  const toggleTopic = (key: string) => {
    setExpandedTopic((prev) => (prev === key ? null : key));
  };

  const openYouTube = (query: string) => {
    window.open(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSearch.trim()) {
      setExpandedTopic("custom");
    }
  };

  const sourceIcon = (source: "quiz" | "test" | "both") => {
    if (source === "quiz") return <BookOpen className="w-3 h-3" />;
    if (source === "test") return <FileText className="w-3 h-3" />;
    return (
      <span className="flex gap-0.5">
        <BookOpen className="w-3 h-3" />
        <FileText className="w-3 h-3" />
      </span>
    );
  };

  const sourceLabel = (source: "quiz" | "test" | "both") => {
    if (source === "quiz") return "Quiz";
    if (source === "test") return "College Test";
    return "Quiz + Test";
  };

  const getYouTubeSearchUrl = (query: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Study Suggestions</h2>
          <p className="text-xs text-muted-foreground">
            Based on quiz scores & college test marks
          </p>
        </div>
      </div>

      {/* Custom YouTube Search */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-3 space-y-3">
          <form onSubmit={handleCustomSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={customSearch}
                onChange={(e) => setCustomSearch(e.target.value)}
                placeholder="Search any topic on YouTube..."
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-9 gap-1.5 bg-red-600 hover:bg-red-700 text-white"
              disabled={!customSearch.trim()}
            >
              <Youtube className="w-3.5 h-3.5" />
              Search
            </Button>
          </form>
          {expandedTopic === "custom" && customSearch.trim() && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground truncate flex-1">
                  Results for "{customSearch}"
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => openYouTube(customSearch)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setExpandedTopic(null)}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <a
                href={getYouTubeSearchUrl(customSearch)}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-border bg-black/90 hover:opacity-90 transition-opacity"
              >
                <AspectRatio ratio={16 / 9}>
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white">
                    <Youtube className="w-12 h-12 text-red-500" />
                    <span className="text-sm font-medium">Watch on YouTube</span>
                    <span className="text-xs text-white/60">"{customSearch}"</span>
                  </div>
                </AspectRatio>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {weakSubjects.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-bold text-base">Great Job! 🎉</h3>
            <p className="text-sm text-muted-foreground">
              You're scoring well across all subjects. Subjects below 70% in quizzes or college
              tests will appear here with YouTube recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-none shadow-sm bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {weakSubjects.length} subject{weakSubjects.length > 1 ? "s" : ""} need
                improvement. Watch recommended videos!
              </p>
            </CardContent>
          </Card>

          {weakSubjects.map((subject) => (
            <Card key={subject.subjectId} className="border-none shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    {subject.name}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      subject.overallScore < 40
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {subject.overallScore}%
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px] gap-1 h-5 px-1.5">
                    {sourceIcon(subject.source)}
                    {sourceLabel(subject.source)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{subject.details}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{subject.details}</span>
                    <span>Target: 70%</span>
                  </div>
                  <Progress value={subject.overallScore} className="h-2" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    Recommended Videos
                  </p>
                  <div className="space-y-1.5">
                    {subject.searchTopics.map((topic, i) => {
                      const topicKey = `${subject.subjectId}-${i}`;
                      const isExpanded = expandedTopic === topicKey;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`flex-1 justify-start text-xs h-9 gap-2 ${
                                isExpanded
                                  ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                                  : "hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/20 dark:hover:border-red-800"
                              }`}
                              onClick={() => toggleTopic(topicKey)}
                            >
                              <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              <span className="truncate">{topic}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 ml-auto shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 ml-auto shrink-0" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 shrink-0"
                              onClick={() => openYouTube(topic)}
                              title="Open in YouTube"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </div>
                          {isExpanded && (
                            <a
                              href={getYouTubeSearchUrl(topic)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden border border-border bg-black/90 hover:opacity-90 transition-opacity"
                            >
                              <AspectRatio ratio={16 / 9}>
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white">
                                  <Youtube className="w-10 h-10 text-red-500" />
                                  <span className="text-xs font-medium">Watch on YouTube</span>
                                  <span className="text-[10px] text-white/60 text-center px-4 truncate max-w-full">{topic}</span>
                                </div>
                              </AspectRatio>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};

export default Suggestions;
