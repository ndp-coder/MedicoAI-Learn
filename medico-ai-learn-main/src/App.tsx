import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ErrorBoundary, OfflineBanner } from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GatedRoute } from "./components/GatedRoute";

// Lazy load all pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DoubtSolver = lazy(() => import("./pages/DoubtSolver"));
const DailyQuiz = lazy(() => import("./pages/DailyQuiz"));
const TopicRecap = lazy(() => import("./pages/TopicRecap"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const StudyGoals = lazy(() => import("./pages/StudyGoals"));
const TestMarks = lazy(() => import("./pages/TestMarks"));
const Suggestions = lazy(() => import("./pages/Suggestions"));
const PomodoroTimer = lazy(() => import("./pages/PomodoroTimer"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Settings = lazy(() => import("./pages/Settings"));
const Notes = lazy(() => import("./pages/Notes"));
const StudyPlan = lazy(() => import("./pages/StudyPlan"));
const VivaPractice = lazy(() => import("./pages/VivaPractice"));
const PYQPractice = lazy(() => import("./pages/PYQPractice"));
const Analytics = lazy(() => import("./pages/Analytics"));
const QuizChallenge = lazy(() => import("./pages/QuizChallenge"));
const CaseStudy = lazy(() => import("./pages/CaseStudy"));
const DiagramQuiz = lazy(() => import("./pages/DiagramQuiz"));
const DrillMode = lazy(() => import("./pages/DrillMode"));
const MistakeJournal = lazy(() => import("./pages/MistakeJournal"));
const MockExam = lazy(() => import("./pages/MockExam"));
const FormulaSheet = lazy(() => import("./pages/FormulaSheet"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DailyChallenge = lazy(() => import("./pages/DailyChallenge"));
const OSCEChecklists = lazy(() => import("./pages/OSCEChecklists"));
const ClinicalCases = lazy(() => import("./pages/ClinicalCases"));
const DiagramExplain = lazy(() => import("./pages/DiagramExplain"));
const NotesSummarizer = lazy(() => import("./pages/NotesSummarizer"));
const LectureRecorder = lazy(() => import("./pages/LectureRecorder"));
const Practice = lazy(() => import("./pages/Practice"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Pricing = lazy(() => import("./pages/Pricing"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <Loader2 className="w-6 h-6 animate-spin text-secondary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <OfflineBanner />
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

                    <Route path="/" element={<Dashboard />} />
                    <Route path="/doubt" element={<DoubtSolver />} />
                    <Route path="/quiz" element={<DailyQuiz />} />
                    <Route path="/quiz/challenge" element={<GatedRoute requiredPlan="Max" featureName="Quiz Challenge"><QuizChallenge /></GatedRoute>} />
                    <Route path="/recap" element={<TopicRecap />} />
                    <Route path="/flashcards" element={<Flashcards />} />
                    <Route path="/goals" element={<StudyGoals />} />
                    <Route path="/marks" element={<TestMarks />} />
                    <Route path="/suggestions" element={<GatedRoute requiredPlan="Max" featureName="Study Tips"><Suggestions /></GatedRoute>} />
                    <Route path="/timer" element={<GatedRoute requiredPlan="Max" featureName="Pomodoro Timer"><PomodoroTimer /></GatedRoute>} />
                    <Route path="/bookmarks" element={<GatedRoute requiredPlan="Max" featureName="Bookmarks"><Bookmarks /></GatedRoute>} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/notes" element={<GatedRoute requiredPlan="Max" featureName="Study Notes"><Notes /></GatedRoute>} />
                    <Route path="/study-plan" element={<GatedRoute requiredPlan="Max" featureName="Study Plan"><StudyPlan /></GatedRoute>} />
                    <Route path="/viva" element={<VivaPractice />} />
                    <Route path="/pyq" element={<PYQPractice />} />
                    <Route path="/analytics" element={<GatedRoute requiredPlan="Max" featureName="Analytics"><Analytics /></GatedRoute>} />
                    <Route path="/case-study" element={<GatedRoute requiredPlan="Max" featureName="Case Study"><CaseStudy /></GatedRoute>} />
                    <Route path="/diagram-quiz" element={<GatedRoute requiredPlan="Max" featureName="Diagram Quiz"><DiagramQuiz /></GatedRoute>} />
                    <Route path="/drill" element={<GatedRoute requiredPlan="Max" featureName="Weak Area Drill"><DrillMode /></GatedRoute>} />
                    <Route path="/mistakes" element={<GatedRoute requiredPlan="Max" featureName="Mistake Journal"><MistakeJournal /></GatedRoute>} />
                    <Route path="/mock-exam" element={<MockExam />} />
                    <Route path="/formula-sheet" element={<GatedRoute requiredPlan="Max" featureName="Formula Sheet"><FormulaSheet /></GatedRoute>} />
                    <Route path="/challenge" element={<GatedRoute requiredPlan="Max" featureName="Daily Challenge"><DailyChallenge /></GatedRoute>} />
                    <Route path="/osce" element={<OSCEChecklists />} />
                    <Route path="/cases" element={<ClinicalCases />} />
                    <Route path="/diagram-explain" element={<GatedRoute requiredPlan="Max" featureName="Explain Diagram"><DiagramExplain /></GatedRoute>} />
                    <Route path="/summarizer" element={<GatedRoute requiredPlan="Max" featureName="Notes Summarizer"><NotesSummarizer /></GatedRoute>} />
                    <Route path="/recorder" element={<GatedRoute requiredPlan="Max" featureName="Lecture Recorder"><LectureRecorder /></GatedRoute>} />
                    <Route path="/practice" element={<GatedRoute requiredPlan="Max" featureName="Practice (SRS)"><Practice /></GatedRoute>} />
                    <Route path="/pricing" element={<Pricing />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
