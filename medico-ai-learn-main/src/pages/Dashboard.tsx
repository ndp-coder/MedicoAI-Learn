import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, BookOpen, RefreshCw, Sparkles, CheckCircle2, Clock, Layers, TrendingUp, Timer, Bookmark, Target, Share2, CalendarDays, Mic, BarChart3, Stethoscope, Zap, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { motivationalQuotes } from "@/lib/subjects";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { getProgress, type SubjectProgress } from "@/lib/progressTracker";
import { getDueFlashcards, getFlashcards } from "@/lib/flashcards";
import { getBookmarks } from "@/lib/bookmarks";
import { getWeeklyHours } from "@/lib/weeklyGoals";
import { getActivityLog } from "@/lib/activityLog";
import StatsCard from "@/components/StatsCard";
import QuizHistory from "@/components/QuizHistory";
import StreakCalendar from "@/components/StreakCalendar";
import { WeeklyReport } from "@/components/WeeklyReport";
import { ExamCountdown } from "@/components/ExamCountdown";
import { StudyReminder } from "@/components/StudyReminder";
import { DailyTip } from "@/components/DailyTip";
import { Leaderboard } from "@/components/Leaderboard";
import { TodayAgenda } from "@/components/TodayAgenda";
import { StreakMilestone } from "@/components/StreakMilestone";
import { XPBar } from "@/components/XPBar";
import { ProgressCard } from "@/components/ProgressCard";
import { getMistakeStats } from "@/lib/mistakeLog";
import { toast } from "sonner";
import { syncFromCloud, pushAllToCloud } from "@/lib/syncEngine";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const subjects = useUserSubjects();
  const navigate = useNavigate();
  const [studentName] = useLocalStorage("dentai-student-name", "");
  const [quizHistory] = useLocalStorage<Record<string, { score: number; total: number }>>("dentai-quiz-history", {});
  const [progress, setProgress] = useState<Record<string, SubjectProgress>>({});
  const [dueCount, setDueCount] = useState(0);
  const [totalCards, setTotalCards] = useState(0);

  const today = new Date().toISOString().split("T")[0];
  const quizDoneToday = !!quizHistory[today];
  const quote = motivationalQuotes[Math.floor(new Date().getDate() % motivationalQuotes.length)];

  const syncDone = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    // Initial cloud sync on first load after login
    if (user && !syncDone.current) {
      syncDone.current = true;
      syncFromCloud().then((synced) => {
        if (synced) {
          setProgress(getProgress());
          setDueCount(getDueFlashcards().length);
          setTotalCards(getFlashcards().length);
          toast.success("Progress synced from cloud! ☁️", { id: "cloud-sync" });
        }
      });
    }
    setProgress(getProgress());
    setDueCount(getDueFlashcards().length);
    setTotalCards(getFlashcards().length);
  }, [user]);

  const totalQuestionsAnswered = useMemo(() => {
    return Object.values(progress).reduce((sum, p) => sum + p.questionsAttempted, 0);
  }, [progress]);

  const weeklyHours = useMemo(() => Math.round(getWeeklyHours() * 10) / 10, []);
  const bookmarkCount = useMemo(() => getBookmarks().length, []);
  const mistakeStats = useMemo(() => getMistakeStats(), []);

  // Weakest subject
  const weakestSubject = useMemo<{ name: string; accuracy: number; id: string } | null>(() => {
    let worst: { name: string; accuracy: number; id: string } | null = null;
    subjects.forEach((s: { id: string; name: string }) => {
      const p = progress[s.id];
      if (p && p.questionsAttempted >= 3) {
        const acc = Math.round((p.questionsCorrect / p.questionsAttempted) * 100);
        if (!worst || acc < worst.accuracy) worst = { name: s.name, accuracy: acc, id: s.id };
      }
    });
    return worst;
  }, [progress]);

  const handleShareProgress = () => {
    const totalCorrect = Object.values(progress).reduce((s, p) => s + p.questionsCorrect, 0);
    const accuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;
    const text = [
      "📊 My MedicoAI Learn Progress",
      `📝 ${totalQuestionsAnswered} questions answered`,
      `🎯 ${accuracy}% accuracy`,
      `📚 ${totalCards} flashcards`,
      `⏱️ ${weeklyHours}h studied this week`,
      "",
      "Study smarter with MedicoAI Learn! 🦷",
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Progress copied to clipboard! Share it! 📋");
  };

  const quickActions = [
    { label: "Ask Doubt", icon: MessageCircle, path: "/doubt", desc: "AI answers" },
    { label: "Quiz", icon: BookOpen, path: "/quiz", desc: "Daily MCQs" },
    { label: "Mock Exam", icon: GraduationCap, path: "/mock-exam", desc: "Full exam" },
    { label: "Drill", icon: Zap, path: "/drill", desc: "Weak areas" },
  ];

  return (
    <div className="animate-page-in">
      <div className="gradient-dental text-black px-4 py-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold opacity-90">
              {studentName ? `Hey ${studentName}! 👋` : "Welcome! 👋"}
            </p>
            <Button variant="ghost" size="sm" onClick={handleShareProgress} className="text-black hover:bg-black/10 text-xs">
              <Share2 className="w-3.5 h-3.5 mr-1" /> Share
            </Button>
          </div>
          <div className="mt-2 flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 opacity-80" />
            <p className="text-xs opacity-80 italic leading-relaxed">"{quote}"</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
        {/* XP Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <XPBar />
          </CardContent>
        </Card>

        {/* Streak Milestone */}
        <StreakMilestone />

        {/* Study Reminders */}
        <StudyReminder />

        {/* Exam Countdown */}
        <ExamCountdown />

        {/* Today's Agenda */}
        <TodayAgenda />

        {/* Daily Tip */}
        <DailyTip />

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard icon={BookOpen} label="Questions Answered" value={totalQuestionsAnswered} />
          <StatsCard icon={Clock} label="Hours This Week" value={weeklyHours} suffix="h" color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-50 dark:bg-amber-950/30" />
          <StatsCard icon={Layers} label="Flashcards" value={totalCards} color="text-purple-600 dark:text-purple-400" bgColor="bg-purple-50 dark:bg-purple-950/30" />
          <StatsCard icon={Bookmark} label="Bookmarked Qs" value={bookmarkCount} color="text-rose-600 dark:text-rose-400" bgColor="bg-rose-50 dark:bg-rose-950/30" />
        </div>

        {/* Quiz & Flashcard Status */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm cursor-pointer" onClick={() => navigate("/quiz")}>
            <CardContent className="p-3 flex items-center gap-2.5">
              {quizDoneToday ? (
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-xs">Today's Quiz</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {quizDoneToday ? `${quizHistory[today].score}/${quizHistory[today].total}` : "Pending"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm cursor-pointer" onClick={() => navigate("/mistakes")}>
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${mistakeStats.total > 0 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"}`}>
                {mistakeStats.total > 0 ? (
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{mistakeStats.total}</span>
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs">Mistakes</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {mistakeStats.total > 0 ? `${mistakeStats.improved} improved` : "No mistakes"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weakest Subject */}
        {weakestSubject && (
          <Card className="border-none shadow-sm border-l-4 border-l-red-400 dark:border-l-red-600 cursor-pointer" onClick={() => navigate("/drill")}>
            <CardContent className="p-3 flex items-center gap-3">
              <Zap className="w-5 h-5 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">Weakest: {weakestSubject.name}</p>
                <p className="text-[10px] text-muted-foreground">{weakestSubject.accuracy}% accuracy — tap to drill</p>
              </div>
              <Badge variant="destructive" className="text-[10px] shrink-0">{weakestSubject.accuracy}%</Badge>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(({ label, icon: Icon, path, desc }) => (
              <button key={path} onClick={() => navigate(path)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border hover:border-secondary hover:shadow-md transition-all group active:scale-95">
                <div className="w-10 h-10 rounded-xl gradient-dental flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold">{label}</p>
                  <p className="text-[9px] text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Card */}
        <ProgressCard />

        {/* Weekly Report */}
        <WeeklyReport />

        {/* Leaderboard */}
        <Leaderboard />

        {/* Streak Calendar */}
        <StreakCalendar />

        {/* Quiz History Chart */}
        <QuizHistory history={quizHistory} />

        {/* Subject Progress */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-secondary" /> Subject Progress
          </h2>
          <div className="space-y-2.5">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              const sp = progress[subject.id];
              const topicCount = sp?.topicsReviewed?.length ?? 0;
              const qAttempted = sp?.questionsAttempted ?? 0;
              const qCorrect = sp?.questionsCorrect ?? 0;
              const accuracy = qAttempted > 0 ? Math.round((qCorrect / qAttempted) * 100) : 0;

              return (
                <Card key={subject.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/doubt")}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${subject.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${subject.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{subject.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {qAttempted > 0 ? `${qAttempted} Qs · ${accuracy}% · ${topicCount} topics` : topicCount > 0 ? `${topicCount} topics reviewed` : "Not started yet"}
                        </p>
                      </div>
                      {qAttempted > 0 && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">{accuracy}%</Badge>
                      )}
                    </div>
                    {(qAttempted > 0 || topicCount > 0) && (
                      <Progress value={Math.min(100, topicCount * 10 + accuracy * 0.5)} className="h-1.5" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
