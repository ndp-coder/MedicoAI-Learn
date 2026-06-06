import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Timer, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { logPomodoroSession, getTodayPomodoroCount, getTodayPomodoroMinutes } from "@/lib/pomodoroStorage";
import { logStudyHours } from "@/lib/weeklyGoals";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type TimerMode = "work" | "break";

interface SubjectTime {
  [subjectId: string]: number; // minutes
}

const COLORS = ["hsl(170,60%,55%)", "hsl(210,55%,45%)", "hsl(350,60%,55%)", "hsl(38,80%,50%)", "hsl(270,50%,55%)", "hsl(160,60%,45%)", "hsl(25,70%,50%)", "hsl(330,50%,55%)"];

const PomodoroTimer = () => {
  const subjects = useUserSubjects();
  const [settings, setSettings] = useLocalStorage("dentai-pomodoro-settings", { work: 25, break: 5 });
  const [editSettings, setEditSettings] = useState(settings);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<TimerMode>("work");
  const [secondsLeft, setSecondsLeft] = useState(settings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [todayCount, setTodayCount] = useState(getTodayPomodoroCount());
  const [todayMinutes, setTodayMinutes] = useState(getTodayPomodoroMinutes());
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectTime, setSubjectTime] = useLocalStorage<SubjectTime>("dentai-pomodoro-subject-time", {});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = mode === "work" ? settings.work * 60 : settings.break * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    if (mode === "work") {
      logPomodoroSession(settings.work);
      logStudyHours(settings.work / 60);
      setTodayCount(getTodayPomodoroCount());
      setTodayMinutes(getTodayPomodoroMinutes());
      // Track subject time
      if (selectedSubject) {
        setSubjectTime(prev => ({ ...prev, [selectedSubject]: (prev[selectedSubject] || 0) + settings.work }));
      }
      toast.success(`Pomodoro complete! Time for a ${settings.break}-min break ☕`);
      setMode("break");
      setSecondsLeft(settings.break * 60);
    } else {
      toast.success("Break over! Ready for another session? 💪");
      setMode("work");
      setSecondsLeft(settings.work * 60);
    }
  }, [mode, settings, selectedSubject, setSubjectTime]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleComplete]);

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(mode === "work" ? settings.work * 60 : settings.break * 60);
  };

  const handleSaveSettings = () => {
    setSettings(editSettings);
    setShowSettings(false);
    if (!isRunning) {
      setSecondsLeft(mode === "work" ? editSettings.work * 60 : editSettings.break * 60);
    }
    toast.success("Timer settings updated!");
  };

  // Pie chart data
  const pieData = Object.entries(subjectTime)
    .filter(([_, mins]) => mins > 0)
    .map(([id, mins]) => ({
      name: subjects.find(s => s.id === id)?.name?.split(" ")[0] || id,
      value: mins,
    }));

  // SVG circle params
  const size = 240;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Pomodoro Timer</h2>
          <p className="text-xs text-muted-foreground">Focus sessions with auto-logged hours</p>
        </div>
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => setEditSettings(settings)}>
              <Settings2 className="w-3.5 h-3.5 mr-1" /> Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader><DialogTitle>Timer Settings</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-3">
                <Timer className="w-4 h-4 text-muted-foreground shrink-0" />
                <label className="text-sm flex-1">Work (min)</label>
                <Input type="number" min={1} max={120} value={editSettings.work} onChange={(e) => setEditSettings({ ...editSettings, work: Math.max(1, parseInt(e.target.value) || 25) })} className="w-20 text-center" />
              </div>
              <div className="flex items-center gap-3">
                <Coffee className="w-4 h-4 text-muted-foreground shrink-0" />
                <label className="text-sm flex-1">Break (min)</label>
                <Input type="number" min={1} max={60} value={editSettings.break} onChange={(e) => setEditSettings({ ...editSettings, break: Math.max(1, parseInt(e.target.value) || 5) })} className="w-20 text-center" />
              </div>
              <Button onClick={handleSaveSettings} className="w-full gradient-teal text-secondary-foreground font-semibold">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subject selector */}
      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="🏷️ Tag a subject (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No subject</SelectItem>
          {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Timer Circle */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth={strokeWidth} fill="none" />
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke={mode === "work" ? "hsl(var(--secondary))" : "hsl(var(--ring))"}
              strokeWidth={strokeWidth} fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1">
              {mode === "work" ? <Timer className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
              {mode === "work" ? "Focus Time" : "Break Time"}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button size="lg" variant="outline" onClick={handleReset} className="rounded-full w-12 h-12 p-0">
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-full w-16 h-16 p-0 gradient-teal text-secondary-foreground shadow-lg"
        >
          {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setMode(mode === "work" ? "break" : "work");
            setIsRunning(false);
            setSecondsLeft(mode === "work" ? settings.break * 60 : settings.work * 60);
          }}
          className="rounded-full w-12 h-12 p-0"
        >
          {mode === "work" ? <Coffee className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{todayCount}</p>
            <p className="text-xs text-muted-foreground">Sessions Today</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{Math.round(todayMinutes)}</p>
            <p className="text-xs text-muted-foreground">Minutes Focused</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Time Breakdown */}
      {pieData.length > 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-bold mb-3">⏱️ Time per Subject</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} min`} contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {pieData.map((d, i) => (
                <span key={d.name} className="text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {d.name} ({d.value}m)
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PomodoroTimer;
