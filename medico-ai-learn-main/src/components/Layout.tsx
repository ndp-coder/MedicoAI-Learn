import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, MessageCircle, BookOpen, RefreshCw, Layers, Target, FileText, Lightbulb, Moon, Sun, Timer, Bookmark, Settings2, MoreHorizontal, StickyNote, CalendarDays, Mic, ClipboardList, BarChart3, Stethoscope, Image, Zap, AlertTriangle, GraduationCap, Calculator, LogOut, Cloud, CloudOff, Loader2, Trophy, ClipboardCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CommandPalette } from "@/components/CommandPalette";
import { getProgress } from "@/lib/progressTracker";
import { getTestMarks } from "@/lib/testMarks";
import { getActiveSubjects, getCurrentCourse, courseLabel } from "@/lib/subjects";
import medicoAiLogo from "@/assets/medicoai-logo.png";
import { getCurrentLevel } from "@/lib/gamification";
import { markPageVisited } from "@/components/FeatureGuide";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { getSyncStatus, onSyncStatusChange } from "@/lib/syncEngine";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const primaryMobileNav = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/doubt", icon: MessageCircle, label: "Doubt" },
  { to: "/quiz", icon: BookOpen, label: "Quiz" },
  { to: "/flashcards", icon: Layers, label: "Cards" },
];

const moreMobileNav = [
  { to: "/challenge", icon: Trophy, label: "Daily" },
  { to: "/cases", icon: Stethoscope, label: "Cases" },
  { to: "/osce", icon: ClipboardCheck, label: "OSCE" },
  { to: "/recap", icon: RefreshCw, label: "Recap" },
  { to: "/notes", icon: StickyNote, label: "Notes" },
  { to: "/study-plan", icon: CalendarDays, label: "Plan" },
  { to: "/formula-sheet", icon: Calculator, label: "Formula" },
  { to: "/mock-exam", icon: GraduationCap, label: "Mock" },
  { to: "/viva", icon: Mic, label: "Viva" },
  { to: "/pyq", icon: ClipboardList, label: "PYQ" },
  { to: "/case-study", icon: Stethoscope, label: "Case" },
  { to: "/diagram-quiz", icon: Image, label: "Diagram" },
  { to: "/drill", icon: Zap, label: "Drill" },
  { to: "/mistakes", icon: AlertTriangle, label: "Mistakes" },
  { to: "/timer", icon: Timer, label: "Timer" },
  { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/marks", icon: FileText, label: "Marks" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/suggestions", icon: Lightbulb, label: "Tips" },
  { to: "/settings", icon: Settings2, label: "Settings" },
];

function SyncIndicator() {
  const [status, setStatus] = useState(getSyncStatus());
  useEffect(() => { const unsub = onSyncStatusChange(setStatus); return () => { unsub(); }; }, []);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center">
          {status === "syncing" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-foreground/70" />
          ) : status === "synced" ? (
            <Cloud className="w-3.5 h-3.5 text-primary-foreground/70" />
          ) : status === "error" ? (
            <CloudOff className="w-3.5 h-3.5 text-primary-foreground/70" />
          ) : null}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {status === "syncing" ? "Syncing..." : status === "synced" ? "Cloud synced" : status === "error" ? "Sync error" : ""}
      </TooltipContent>
    </Tooltip>
  );
}

const Layout = () => {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [showMore, setShowMore] = useState(false);
  const { commandOpen, setCommandOpen } = useKeyboardShortcuts();
  const level = getCurrentLevel();
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    markPageVisited(location.pathname);
  }, [location.pathname]);

  const weakCount = useMemo(() => {
    const progress = getProgress();
    const testMarks = getTestMarks();
    let count = 0;
    getActiveSubjects().forEach((subject) => {
      const p = progress[subject.id];
      const quizAccuracy = p && p.questionsAttempted > 0 ? Math.round((p.questionsCorrect / p.questionsAttempted) * 100) : null;
      const subjectMarks = testMarks.filter((m) => m.subjectId === subject.id);
      const testAverage = subjectMarks.length > 0 ? Math.round(subjectMarks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / subjectMarks.length) : null;
      if ((quizAccuracy !== null && quizAccuracy < 70) || (testAverage !== null && testAverage < 70)) count++;
    });
    return count;
  }, []);

  const currentCourse = getCurrentCourse();

  const userInitial = user?.user_metadata?.student_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        <header className="gradient-dental text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <img src={medicoAiLogo} alt="MedicoAI Learn logo" width={36} height={36} className="w-9 h-9 rounded-lg bg-white/15 p-1" />
            <div>
              <span className="block text-lg font-bold leading-tight tracking-tight" aria-label="MedicoAI Learn — AI-Powered Medical Education">MedicoAI Learn</span>
              <p className="text-[10px] opacity-80 font-medium">{courseLabel(currentCourse)} · {level.emoji} {level.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <SyncIndicator />
            <Button aria-label="Toggle theme" variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-primary-foreground hover:bg-white/10 rounded-full w-9 h-9">
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </Button>
            <Button aria-label="Sign out" variant="ghost" size="icon" onClick={() => signOut()} className="text-primary-foreground hover:bg-white/10 rounded-full w-8 h-8">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 pb-20 overflow-y-auto"><Outlet /></main>

        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {primaryMobileNav.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2 px-2 min-w-[3rem] text-[10px] font-medium transition-colors ${isActive ? "text-secondary" : "text-muted-foreground hover:text-foreground"}`}>
                {({ isActive }) => (
                  <>
                    <div className={`p-1 rounded-lg transition-all ${isActive ? "bg-secondary/10" : ""}`}>
                      <Icon className="w-4.5 h-4.5" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
            <Sheet open={showMore} onOpenChange={setShowMore}>
              <SheetTrigger asChild>
                <button aria-label="View more study details and tools" className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-[3rem] text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <div className="p-1 rounded-lg"><MoreHorizontal className="w-4.5 h-4.5" /></div>
                  <span>More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader><SheetTitle>More</SheetTitle></SheetHeader>
                <div className="grid grid-cols-4 gap-3 py-4">
                  {moreMobileNav.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} onClick={() => setShowMore(false)} className={({ isActive }) => `flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors active:scale-95 ${isActive ? "bg-secondary/10 text-secondary" : "text-muted-foreground hover:text-foreground"}`}>
                      <div className="relative">
                        <Icon className="w-5 h-5" />
                        {label === "Tips" && weakCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{weakCount > 9 ? "9+" : weakCount}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium">{label}</span>
                    </NavLink>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
        <AppSidebar weakCount={weakCount} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="gradient-dental text-black px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-black hover:bg-black/10 rounded-lg" />
              <img src={medicoAiLogo} alt="MedicoAI Learn logo" width={28} height={28} className="w-7 h-7" />
              <span className="text-base font-bold tracking-tight" aria-label="MedicoAI Learn — AI-Powered Medical Education">MedicoAI Learn</span>
              <span className="text-xs opacity-90 font-medium hidden sm:inline">{courseLabel(currentCourse)} · {level.emoji} {level.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <SyncIndicator />
              <Button aria-label="Open command palette" variant="ghost" size="sm" onClick={() => setCommandOpen(true)} className="text-black hover:bg-black/10 text-xs hidden sm:flex">
                ⌘K
              </Button>
              <Button aria-label="Toggle theme" variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-black hover:bg-black/10 rounded-full w-9 h-9">
                {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold" aria-hidden="true">
                      {userInitial}
                    </div>
                    <Button aria-label="Sign out" variant="ghost" size="icon" onClick={() => signOut()} className="text-black hover:bg-black/10 rounded-full w-8 h-8">
                      <LogOut className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{user?.email}</TooltipContent>
              </Tooltip>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
