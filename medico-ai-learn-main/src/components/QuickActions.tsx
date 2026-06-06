import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap, Layers, StickyNote, BookOpen, Timer, Brain } from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}

interface QuickActionsProps {
  context: "quiz" | "drill" | "viva" | "case-study" | "recap" | "mock-exam";
  subjectId?: string;
  topic?: string;
}

const ACTION_MAP: Record<string, QuickAction[]> = {
  quiz: [
    { label: "Review Mistakes", icon: AlertTriangle, path: "/mistakes" },
    { label: "Drill Weak Areas", icon: Zap, path: "/drill" },
    { label: "Create Flashcards", icon: Layers, path: "/flashcards" },
  ],
  drill: [
    { label: "Review Mistakes", icon: AlertTriangle, path: "/mistakes" },
    { label: "Take Full Quiz", icon: BookOpen, path: "/quiz" },
    { label: "Create Flashcards", icon: Layers, path: "/flashcards" },
  ],
  viva: [
    { label: "Drill Missed Topics", icon: Zap, path: "/drill" },
    { label: "Create Notes", icon: StickyNote, path: "/notes" },
    { label: "Review Mistakes", icon: AlertTriangle, path: "/mistakes" },
  ],
  "case-study": [
    { label: "Drill This Topic", icon: Zap, path: "/drill" },
    { label: "Create Notes", icon: StickyNote, path: "/notes" },
    { label: "Start Pomodoro", icon: Timer, path: "/timer" },
  ],
  recap: [
    { label: "Quiz Me", icon: BookOpen, path: "/quiz" },
    { label: "Create Flashcards", icon: Layers, path: "/flashcards" },
    { label: "Start Pomodoro", icon: Timer, path: "/timer" },
  ],
  "mock-exam": [
    { label: "Review Mistakes", icon: AlertTriangle, path: "/mistakes" },
    { label: "Drill Weak Areas", icon: Zap, path: "/drill" },
    { label: "Study Plan", icon: Brain, path: "/study-plan" },
  ],
};

export function QuickActions({ context }: QuickActionsProps) {
  const navigate = useNavigate();
  const actions = ACTION_MAP[context] || [];

  if (actions.length === 0) return null;

  return (
    <div className="space-y-2 animate-slide-up">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">What's next?</p>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ label, icon: Icon, path }) => (
          <Button
            key={label}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => navigate(path)}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
