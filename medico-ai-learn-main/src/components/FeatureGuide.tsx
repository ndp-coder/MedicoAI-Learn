import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Home, MessageCircle, BookOpen, RefreshCw, Layers, Target, FileText, Lightbulb,
  Timer, Bookmark, StickyNote, CalendarDays, Mic, ClipboardList, BarChart3,
  Stethoscope, Image, Zap, AlertTriangle, GraduationCap, Calculator, Settings2
} from "lucide-react";

const FEATURES = [
  { path: "/", icon: Home, name: "Dashboard", desc: "XP progress, streaks, agenda, and quick actions" },
  { path: "/doubt", icon: MessageCircle, name: "Ask a Doubt", desc: "AI-powered dental Q&A with image support and TTS" },
  { path: "/quiz", icon: BookOpen, name: "Daily Quiz", desc: "AI-generated MCQs with explanations and follow-ups" },
  { path: "/mock-exam", icon: GraduationCap, name: "Mock Exam", desc: "Full-length timed exam simulation" },
  { path: "/viva", icon: Mic, name: "Viva Practice", desc: "AI oral exam with voice input and scoring" },
  { path: "/drill", icon: Zap, name: "Weak Area Drill", desc: "Rapid-fire MCQs targeting your weak subjects" },
  { path: "/recap", icon: RefreshCw, name: "Topic Recap", desc: "AI summaries with mnemonics and cross-links" },
  { path: "/case-study", icon: Stethoscope, name: "Case Study", desc: "Clinical case diagnosis and treatment simulation" },
  { path: "/diagram-quiz", icon: Image, name: "Diagram Quiz", desc: "Upload diagrams for AI-generated questions" },
  { path: "/pyq", icon: ClipboardList, name: "PYQ Practice", desc: "Previous year question practice" },
  { path: "/flashcards", icon: Layers, name: "Flashcards", desc: "SRS-based spaced repetition learning" },
  { path: "/mistakes", icon: AlertTriangle, name: "Mistake Journal", desc: "Track and re-practice wrong answers" },
  { path: "/formula-sheet", icon: Calculator, name: "Formula Sheet", desc: "AI-generated key facts and formulas" },
  { path: "/notes", icon: StickyNote, name: "Study Notes", desc: "Create, organize, and share study notes" },
  { path: "/study-plan", icon: CalendarDays, name: "Study Plan", desc: "AI-generated day-by-day exam schedules" },
  { path: "/timer", icon: Timer, name: "Pomodoro Timer", desc: "Focus timer with subject tagging" },
  { path: "/bookmarks", icon: Bookmark, name: "Bookmarks", desc: "Save important questions for later" },
  { path: "/goals", icon: Target, name: "Study Goals", desc: "Weekly targets and progress tracking" },
  { path: "/marks", icon: FileText, name: "Test Marks", desc: "Log marks and track GPA trends" },
  { path: "/analytics", icon: BarChart3, name: "Analytics", desc: "Deep performance insights and heatmaps" },
  { path: "/suggestions", icon: Lightbulb, name: "Study Tips", desc: "AI-powered recommendations for weak areas" },
  { path: "/settings", icon: Settings2, name: "Settings", desc: "Profile, data export, and preferences" },
];

const VISITED_KEY = "dentai-visited-pages";

export function getVisitedPages(): string[] {
  try {
    return JSON.parse(localStorage.getItem(VISITED_KEY) || "[]");
  } catch { return []; }
}

export function markPageVisited(path: string) {
  const visited = getVisitedPages();
  if (!visited.includes(path)) {
    visited.push(path);
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
  }
}

export function isPageNew(path: string): boolean {
  return !getVisitedPages().includes(path);
}

export function FeatureGuide() {
  const navigate = useNavigate();
  const visited = useMemo(() => getVisitedPages(), []);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">📚 Feature Guide</CardTitle>
        <p className="text-[10px] text-muted-foreground">
          {visited.length}/{FEATURES.length} features explored
        </p>
      </CardHeader>
      <CardContent className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {FEATURES.map(({ path, icon: Icon, name, desc }) => {
          const isNew = !visited.includes(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
              </div>
              {isNew && <Badge variant="secondary" className="text-[8px] shrink-0 bg-secondary/20 text-secondary">New</Badge>}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
