import { useState, useMemo, useRef } from "react";
import { Settings2, Trash2, Download, Upload, User, Info, CalendarClock, Bell, BookOpen, Lock, Cloud, LogOut, AlertTriangle, Bot, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { FeatureGuide } from "@/components/FeatureGuide";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { pushAllToCloud, syncFromCloud } from "@/lib/syncEngine";
import { getXPData, getCurrentLevel } from "@/lib/gamification";
import type { AIPreferences } from "@/lib/stream";

const STORAGE_KEYS = [
  "dentai-student-name", "dentai-quiz-history", "dentai-subject-progress",
  "dentai-flashcards", "dentai-activity-log", "dentai-study-hours-log",
  "dentai-weekly-goals", "dentai-test-marks", "dentai-streak",
  "dentai-pomodoro-sessions", "dentai-pomodoro-settings", "dentai-bookmarks",
  "dentai-recent-topics", "dentai-study-notes", "dentai-year",
  "dentai-focus-subjects", "dentai-exam-date", "dentai-exam-name",
  "doubt-chats", "doubt-active-chat", "dentai-visited-pages",
  "dentai-xp", "dentai-mistake-log", "dentai-gamification",
  "dentai-ai-preferences",
];

const Settings = () => {
  const { user, signOut, updatePassword } = useAuth();
  const [studentName, setStudentName] = useLocalStorage("dentai-student-name", "");
  const [nameInput, setNameInput] = useState(studentName);
  const [yearOfStudy, setYearOfStudy] = useLocalStorage("dentai-year", "");
  const [yearInput, setYearInput] = useState(yearOfStudy);
  const [examDate, setExamDate] = useLocalStorage("dentai-exam-date", "");
  const [examName, setExamName] = useLocalStorage("dentai-exam-name", "");
  const [examDateInput, setExamDateInput] = useState(examDate);
  const [examNameInput, setExamNameInput] = useState(examName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifEnabled, setNotifEnabled] = useLocalStorage("dentai-notifications", "false");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiPreferences, setAiPreferences] = useLocalStorage<AIPreferences>("dentai-ai-preferences", {});

  const xpData = getXPData();
  const level = getCurrentLevel();

  const handleToggleNotifications = async () => {
    if (notifEnabled === "true") {
      setNotifEnabled("false");
      toast.success("Notifications disabled");
      return;
    }
    if (!("Notification" in window)) {
      toast.error("Your browser doesn't support notifications");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled("true");
      new Notification("🦷 MedicoAI Learn", { body: "Notifications enabled! We'll remind you to study.", icon: "/favicon.ico" });
      toast.success("Notifications enabled!");
    } else {
      toast.error("Notification permission denied");
    }
  };

  const storageUsage = useMemo(() => {
    let total = 0;
    STORAGE_KEYS.forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) total += item.length * 2;
    });
    return (total / 1024).toFixed(1);
  }, []);

  const handleSaveProfile = () => {
    if (nameInput.trim()) setStudentName(nameInput.trim());
    setYearOfStudy(yearInput);
    setExamDate(examDateInput);
    setExamName(examNameInput);
    import("@/lib/syncEngine").then(({ syncToCloud }) => {
      syncToCloud("profile", () => ({
        studentName: nameInput.trim(),
        yearOfStudy: yearInput,
        examDate: examDateInput,
        examName: examNameInput,
      }));
    });
    toast.success("Profile updated! 👋");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setChangingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      toast.success("Password updated!");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await pushAllToCloud();
      toast.success("All data synced to cloud! ☁️");
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setSyncing(true);
    try {
      await syncFromCloud();
      toast.success("Data restored from cloud! Refreshing...");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Failed to pull data from cloud");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAll = () => {
    STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    toast.success("All local data cleared. Refreshing...");
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleSaveAIPreferences = () => {
    toast.success("AI preferences saved! 🤖");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold">Settings</h2>
        <p className="text-xs text-muted-foreground">Manage your profile and data</p>
      </div>

      {/* Account */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-secondary" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-dental flex items-center justify-center text-xl font-bold text-primary-foreground">
              {user?.user_metadata?.student_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">{level.emoji} {level.name} · {xpData.totalXP} XP</p>
              <p className="text-[10px] text-muted-foreground">Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-secondary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Student Name</label>
            <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Year of Study</label>
            <Input value={yearInput} onChange={(e) => setYearInput(e.target.value)} placeholder="e.g., BDS 2nd Year" />
          </div>
          <Button onClick={handleSaveProfile} className="w-full gradient-teal text-secondary-foreground font-semibold">Save Profile</Button>
        </CardContent>
      </Card>

      {/* AI Customization */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" /> AI Response Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">Customize how MedicoAI answers your questions</p>

          <div>
            <label className="text-xs font-medium mb-1.5 block">Language Style</label>
            <Select
              value={aiPreferences.languageStyle || "default"}
              onValueChange={(v) => setAiPreferences(prev => ({ ...prev, languageStyle: v === "default" ? undefined : v as "simple" | "technical" }))}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">🎯 Default (balanced)</SelectItem>
                <SelectItem value="simple">📝 Simple & Easy (explain like I'm new)</SelectItem>
                <SelectItem value="technical">🔬 Technical & Advanced (professional level)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">Answer Format</label>
            <Select
              value={aiPreferences.answerFormat || "default"}
              onValueChange={(v) => setAiPreferences(prev => ({ ...prev, answerFormat: v === "default" ? undefined : v as "paragraphs" | "bullets" | "tables" | "step-by-step" }))}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">🎯 Default (AI decides)</SelectItem>
                <SelectItem value="paragraphs">📄 Paragraphs</SelectItem>
                <SelectItem value="bullets">• Bullet Points</SelectItem>
                <SelectItem value="tables">📊 Tables</SelectItem>
                <SelectItem value="step-by-step">🔢 Step-by-Step</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSaveAIPreferences} variant="outline" className="w-full">
            <Bot className="w-3.5 h-3.5 mr-2" /> Save AI Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-secondary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" />
          <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline" className="w-full">
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Exam Countdown */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-secondary" /> Exam Countdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Exam Name</label>
            <Input value={examNameInput} onChange={(e) => setExamNameInput(e.target.value)} placeholder="e.g., University Exam" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Exam Date</label>
            <Input type="date" value={examDateInput} onChange={(e) => setExamDateInput(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} variant="outline" className="w-full">Set Exam Date</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bell className="w-4 h-4 text-secondary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Study Reminders</p>
              <p className="text-xs text-muted-foreground">Get notified when you haven't studied</p>
            </div>
            <Switch checked={notifEnabled === "true"} onCheckedChange={handleToggleNotifications} />
          </div>
        </CardContent>
      </Card>

      {/* Feature Guide */}
      <FeatureGuide />

      {/* Cloud Sync */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Cloud className="w-4 h-4 text-secondary" /> Cloud Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Your data syncs automatically. Use these buttons for manual control.</p>
          <Button variant="outline" className="w-full justify-start" onClick={handleSyncNow} disabled={syncing}>
            <Upload className="w-4 h-4 mr-2" /> {syncing ? "Syncing..." : "Push All to Cloud"}
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={handlePullFromCloud} disabled={syncing}>
            <Download className="w-4 h-4 mr-2" /> {syncing ? "Syncing..." : "Pull from Cloud"}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-secondary" /> Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Local Storage Used</span>
            </div>
            <span className="text-sm font-semibold">{storageUsage} KB</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 className="w-4 h-4 mr-2" /> Clear Local Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear local data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears local storage. Your cloud data remains safe. You can pull it back anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Clear Local Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">⌨️ Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { key: "Cmd+K", action: "Ask a doubt" },
              { key: "Q", action: "Go to quiz" },
              { key: "N", action: "Go to notes" },
              { key: "D", action: "Go to dashboard" },
              { key: "T", action: "Go to timer" },
            ].map(({ key, action }) => (
              <div key={key} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <span className="text-muted-foreground">{action}</span>
                <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px] font-mono">{key}</kbd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
