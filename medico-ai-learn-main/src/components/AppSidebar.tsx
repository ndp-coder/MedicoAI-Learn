import { Home, MessageCircle, BookOpen, RefreshCw, Layers, Target, FileText, Lightbulb, Timer, Bookmark, Settings2, StickyNote, CalendarDays, Mic, ClipboardList, BarChart3, Stethoscope, Image, Zap, AlertTriangle, GraduationCap, Calculator, Trophy, ClipboardCheck, Sparkles, Brain } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { isPageNew } from "@/components/FeatureGuide";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import medicoAiLogo from "@/assets/medicoai-logo.png";
import { useSubscription } from "@/hooks/useSubscription";

const learnItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/doubt", icon: MessageCircle, label: "Ask a Doubt" },
  { to: "/diagram-explain", icon: Image, label: "Explain Diagram" },
  { to: "/summarizer", icon: Sparkles, label: "AI Summarizer" },
  { to: "/recorder", icon: Mic, label: "Lecture Recorder" },
  { to: "/recap", icon: RefreshCw, label: "Topic Recap" },
  { to: "/notes", icon: StickyNote, label: "Study Notes" },
  { to: "/study-plan", icon: CalendarDays, label: "Study Plan" },
  { to: "/formula-sheet", icon: Calculator, label: "Formula Sheet" },
];

const practiceItems = [
  { to: "/challenge", icon: Trophy, label: "Daily Challenge" },
  { to: "/quiz", icon: BookOpen, label: "Daily Quiz" },
  { to: "/mock-exam", icon: GraduationCap, label: "Mock Exam" },
  { to: "/cases", icon: Stethoscope, label: "Clinical Cases" },
  { to: "/osce", icon: ClipboardCheck, label: "OSCE Checklists" },
  { to: "/viva", icon: Mic, label: "Viva Practice" },
  { to: "/pyq", icon: ClipboardList, label: "PYQ Practice" },
  { to: "/case-study", icon: Stethoscope, label: "Case Study" },
  { to: "/diagram-quiz", icon: Image, label: "Diagram Quiz" },
  { to: "/drill", icon: Zap, label: "Weak Area Drill" },
  { to: "/mistakes", icon: AlertTriangle, label: "Mistake Journal" },
  { to: "/flashcards", icon: Layers, label: "Flashcards" },
  { to: "/practice", icon: Brain, label: "Practice (SRS)" },
  { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { to: "/timer", icon: Timer, label: "Pomodoro" },
];

const trackItems = [
  { to: "/goals", icon: Target, label: "Study Goals" },
  { to: "/marks", icon: FileText, label: "Test Marks" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/suggestions", icon: Lightbulb, label: "Study Tips" },
  { to: "/settings", icon: Settings2, label: "Settings" },
  { to: "/pricing", icon: Zap, label: "Upgrade Plan" },
];

interface AppSidebarProps {
  weakCount: number;
}

export function AppSidebar({ weakCount }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { plan, loading } = useSubscription();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const renderGroup = (label: string, items: typeof learnItems) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-sidebar-foreground/50">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const showNew = isPageNew(item.to) && item.to !== "/";
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={collapsed ? item.label : undefined}>
                  <NavLink to={item.to} end={item.to === "/"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <div className="relative">
                      <item.icon className="h-4 w-4" />
                      {item.label === "Study Tips" && weakCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
                          {weakCount > 9 ? "9+" : weakCount}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <span className="flex-1 flex items-center gap-1.5">
                        {item.label}
                        {showNew && (
                          <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-sidebar-primary/20 text-sidebar-primary leading-none">NEW</span>
                        )}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? "justify-center px-2" : ""}`}>
          <img src={medicoAiLogo} alt="MedicoAI Learn logo" width={32} height={32} className="w-8 h-8 rounded-lg bg-sidebar-primary/10 p-1 shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden flex flex-col items-start">
              <h2 className="text-sm font-bold text-sidebar-foreground leading-tight truncate">MedicoAI Learn</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-sidebar-foreground/60 truncate">AI-Powered</p>
                {!loading && (
                  <Badge variant={plan === "free" ? "outline" : "default"} className="text-[8px] h-3 px-1 py-0 uppercase">
                    {plan}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {renderGroup("Learn", learnItems)}
        {renderGroup("Practice", practiceItems)}
        {renderGroup("Track", trackItems)}
      </SidebarContent>
    </Sidebar>
  );
}
