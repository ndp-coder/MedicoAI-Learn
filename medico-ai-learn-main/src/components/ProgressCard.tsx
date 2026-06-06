import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share2 } from "lucide-react";
import { getCurrentLevel, getXPData } from "@/lib/gamification";
import { getProgress } from "@/lib/progressTracker";
import { getFlashcards } from "@/lib/flashcards";
import { getWeeklyHours } from "@/lib/weeklyGoals";
import { getActivityLog } from "@/lib/activityLog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

export function ProgressCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [studentName] = useLocalStorage("dentai-student-name", "");
  const [yearOfStudy] = useLocalStorage("dentai-year", "");
  
  const level = getCurrentLevel();
  const xpData = getXPData();
  const progress = getProgress();
  const flashcards = getFlashcards();
  const weeklyHours = Math.round(getWeeklyHours() * 10) / 10;
  const activeDays = Object.keys(getActivityLog()).length;
  
  const totalQ = Object.values(progress).reduce((s, p) => s + p.questionsAttempted, 0);
  const totalCorrect = Object.values(progress).reduce((s, p) => s + p.questionsCorrect, 0);
  const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  const handleShare = () => {
    const text = [
      `🦷 MedicoAI Learn — ${studentName || "Student"}'s Progress Card`,
      `${level.emoji} Level: ${level.name}`,
      `⚡ ${xpData.totalXP.toLocaleString()} XP`,
      `🎯 ${accuracy}% Accuracy (${totalQ} questions)`,
      `📚 ${flashcards.length} Flashcards`,
      `⏱️ ${weeklyHours}h this week`,
      `🔥 ${activeDays} active days`,
      "",
      "Study smarter with MedicoAI Learn! 🦷",
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Progress card copied! Share it! 📋");
  };

  return (
    <Card className="border-none shadow-md overflow-hidden" ref={cardRef}>
      <div className="gradient-dental p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">{studentName || "Student"}</p>
            <p className="text-[10px] opacity-80">{yearOfStudy || "BDS Student"}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl">{level.emoji}</p>
            <p className="text-[10px] font-semibold">{level.name}</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div>
            <p className="text-lg font-bold">{xpData.totalXP.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Total XP</p>
          </div>
          <div>
            <p className="text-lg font-bold">{accuracy}%</p>
            <p className="text-[9px] text-muted-foreground">Accuracy</p>
          </div>
          <div>
            <p className="text-lg font-bold">{activeDays}</p>
            <p className="text-[9px] text-muted-foreground">Active Days</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <Badge variant="secondary" className="justify-center text-[10px]">📝 {totalQ} Questions</Badge>
          <Badge variant="secondary" className="justify-center text-[10px]">📚 {flashcards.length} Cards</Badge>
        </div>
        <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleShare}>
          <Share2 className="w-3.5 h-3.5 mr-1" /> Share Progress
        </Button>
      </CardContent>
    </Card>
  );
}
