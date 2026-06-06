import { getXPData, getCurrentLevel, getNextLevel, getLevelProgress, LEVELS } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, Zap } from "lucide-react";

export function XPBar() {
  const data = getXPData();
  const level = getCurrentLevel();
  const next = getNextLevel();
  const progress = getLevelProgress();
  const dailyProgress = Math.min(100, Math.round((data.dailyXP / data.dailyXPGoal) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{level.emoji}</span>
          <div>
            <p className="text-xs font-bold">{level.name}</p>
            <p className="text-[10px] text-muted-foreground">{data.totalXP.toLocaleString()} XP</p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Zap className="w-3 h-3" /> {data.dailyXP}/{data.dailyXPGoal}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Daily XP: {dailyProgress}% of goal</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {next && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{level.emoji} {level.name}</span>
            <span>{next.emoji} {next.name}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-[10px] text-muted-foreground text-right">
            {next.minXP - data.totalXP} XP to next level
          </p>
        </div>
      )}
      
      {!next && (
        <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
          <Star className="w-3 h-3" /> Max level reached!
        </div>
      )}
    </div>
  );
}
