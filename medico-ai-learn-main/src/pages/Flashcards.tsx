import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, ThumbsUp, ThumbsDown, Trash2, Layers, Brain, Plus, Save, Zap, BarChart3, Timer, FastForward, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getFlashcards, getDueFlashcards, reviewFlashcard, removeFlashcard, addFlashcard, type Flashcard } from "@/lib/flashcards";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { allSubjects } from "@/lib/subjects";
import { logActivity } from "@/lib/activityLog";
import { FlashcardStats } from "@/components/FlashcardStats";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeOverlay } from "@/components/UpgradeOverlay";

type FlashcardMode = "review" | "browse" | "cram" | "stats" | "revision";

const Flashcards = () => {
  const { canAccess, loading: isSubLoading } = useSubscription();
  const hasGoAccess = canAccess("go");
  const subjects = useUserSubjects();
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<FlashcardMode>("review");
  const [revisionTimer, setRevisionTimer] = useState(10);
  const [revisionProgress, setRevisionProgress] = useState(0);
  const revisionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const refresh = useCallback(() => {
    setAllCards(getFlashcards());
    setDueCards(getDueFlashcards());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Filter cards by subject and search
  const filteredAllCards = allCards.filter(c => {
    const matchSubject = filterSubject === "all" || c.subjectId === filterSubject;
    const matchSearch = !searchTerm || c.term.toLowerCase().includes(searchTerm.toLowerCase()) || c.definition.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSubject && matchSearch;
  });

  const filteredDueCards = dueCards.filter(c => {
    const matchSubject = filterSubject === "all" || c.subjectId === filterSubject;
    return matchSubject;
  });

  // Revision mode: prioritize cards by due date + failures
  const revisionCards = filteredAllCards
    .sort((a, b) => {
      const scoreA = (a.repetitions === 0 ? 3 : 0) + (a.easeFactor < 2 ? 2 : 0) + (a.nextReview <= new Date().toISOString().split("T")[0] ? 1 : 0);
      const scoreB = (b.repetitions === 0 ? 3 : 0) + (b.easeFactor < 2 ? 2 : 0) + (b.nextReview <= new Date().toISOString().split("T")[0] ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 20);

  const currentCards = mode === "review" ? filteredDueCards : mode === "revision" ? revisionCards : filteredAllCards;
  const current = currentCards[currentIndex];
  const totalCards = currentCards.length;

  const masteredCount = filteredAllCards.filter(c => c.repetitions >= 3).length;
  const learningCount = filteredAllCards.filter(c => c.repetitions > 0 && c.repetitions < 3).length;
  const newCount = filteredAllCards.filter(c => c.repetitions === 0).length;

  const grouped = filteredAllCards.reduce((acc, card) => {
    if (!acc[card.subjectId]) acc[card.subjectId] = [];
    acc[card.subjectId].push(card);
    return acc;
  }, {} as Record<string, Flashcard[]>);

  // Get unique subjects that have cards (across all years)
  const subjectsWithCards = [...new Set(allCards.map(c => c.subjectId))];

  const handleReview = (quality: number) => {
    if (!current) return;
    reviewFlashcard(current.id, quality);
    logActivity("flashcards");
    toast.success(quality >= 3 ? "Got it! ✅" : "Will review again soon 🔄");
    setFlipped(false);
    refresh();
    if (currentIndex >= filteredDueCards.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleDelete = (id: string) => {
    removeFlashcard(id);
    toast.success("Flashcard removed");
    refresh();
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleCreate = () => {
    if (!newTerm.trim() || !newDef.trim() || !newSubject) {
      toast.error("Fill in all fields");
      return;
    }
    addFlashcard(newTerm.trim(), newDef.trim(), newSubject);
    setNewTerm("");
    setNewDef("");
    setShowCreate(false);
    refresh();
    toast.success("Flashcard created! 📝");
  };

  const handleExport = () => {
    const text = filteredAllCards.map(c => `Q: ${c.term}\nA: ${c.definition}\nSubject: ${getSubjectName(c.subjectId)}\n`).join("\n---\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Flashcards copied to clipboard! 📋");
  };

  const getSubjectName = (id: string) => {
    return allSubjects.find((s) => s.id === id)?.name ?? subjects.find((s) => s.id === id)?.name ?? id;
  };

  if (allCards.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center animate-page-in relative min-h-[60vh]">
        {!isSubLoading && !hasGoAccess && (
          <UpgradeOverlay featureName="Flashcards" requiredPlan="Go" />
        )}
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
          <Layers className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-1">No Flashcards Yet</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a Topic Recap and save key terms, or create your own!
        </p>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gradient-teal text-secondary-foreground font-semibold">
              <Plus className="w-4 h-4 mr-1" /> Create Flashcard
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>New Flashcard</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Term / Question" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} />
              <Textarea placeholder="Definition / Answer" value={newDef} onChange={(e) => setNewDef(e.target.value)} rows={3} />
              <Select value={newSubject} onValueChange={setNewSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full gradient-teal text-secondary-foreground font-semibold">
                <Save className="w-4 h-4 mr-1" /> Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in relative min-h-[60vh]">
      {!isSubLoading && !hasGoAccess && (
        <UpgradeOverlay featureName="Flashcards" requiredPlan="Go" />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Flashcards</h2>
          <p className="text-xs text-muted-foreground">
            {filteredDueCards.length} due · {filteredAllCards.length} total
          </p>
        </div>
        <div className="flex gap-1">
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5" /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader><DialogTitle>New Flashcard</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Term / Question" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} />
                <Textarea placeholder="Definition / Answer" value={newDef} onChange={(e) => setNewDef(e.target.value)} rows={3} />
                <Select value={newSubject} onValueChange={setNewSubject}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreate} className="w-full gradient-teal text-secondary-foreground font-semibold">
                  <Save className="w-4 h-4 mr-1" /> Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <Select value={filterSubject} onValueChange={(v) => { setFilterSubject(v); setCurrentIndex(0); setFlipped(false); }}>
            <SelectTrigger className="h-8 text-xs">
              <Filter className="w-3 h-3 mr-1.5" />
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjectsWithCards.map((sid) => (
                <SelectItem key={sid} value={sid}>{getSubjectName(sid)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentIndex(0); }}
          className="h-8 text-xs flex-1"
        />
      </div>

      {/* Stats bar */}
      <div className="flex gap-2">
        <Badge variant="secondary" className="text-[10px]">✅ {masteredCount} mastered</Badge>
        <Badge variant="outline" className="text-[10px]">📖 {learningCount} learning</Badge>
        <Badge variant="outline" className="text-[10px]">🆕 {newCount} new</Badge>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1 flex-wrap">
        {([
          { key: "review" as FlashcardMode, icon: Brain, label: "Review" },
          { key: "cram" as FlashcardMode, icon: Zap, label: "Cram" },
          { key: "revision" as FlashcardMode, icon: FastForward, label: "Quick Rev" },
          { key: "browse" as FlashcardMode, icon: Layers, label: "Decks" },
          { key: "stats" as FlashcardMode, icon: BarChart3, label: "Stats" },
        ]).map(({ key, icon: Icon, label }) => (
          <Button key={key} size="sm" variant={mode === key ? "default" : "outline"}
            onClick={() => { setMode(key); setCurrentIndex(0); setFlipped(false); if (revisionTimerRef.current) clearInterval(revisionTimerRef.current); setRevisionTimer(10); }}
            className={mode === key ? "gradient-teal text-secondary-foreground" : ""}>
            <Icon className="w-3.5 h-3.5 mr-1" /> {label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={handleExport} className="ml-auto text-xs">Export</Button>
      </div>

      {/* Stats mode */}
      {mode === "stats" ? (
        <FlashcardStats />
      ) : mode === "revision" ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">
              ⚡ Quick Revision — {revisionCards.length} priority cards (10s each)
            </p>
            <Progress value={((currentIndex + 1) / revisionCards.length) * 100} className="h-1.5" />
          </div>
          {current ? (
            <>
              <Card className="border-none shadow-md min-h-[200px] flex items-center justify-center cursor-pointer" onClick={() => setFlipped(!flipped)}>
                <CardContent className="p-6 text-center w-full">
                  {!flipped ? (
                    <>
                      <Badge variant="secondary" className="text-[10px] mb-3">{getSubjectName(current.subjectId)}</Badge>
                      <p className="text-xl font-bold">{current.term}</p>
                      <p className="text-xs text-muted-foreground mt-3">Tap to reveal</p>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-[10px] mb-3">Answer</Badge>
                      <p className="text-sm leading-relaxed line-clamp-1">{current.definition}</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentIndex + 1} / {revisionCards.length}</span>
                <Button size="sm" onClick={() => { setCurrentIndex(i => Math.min(i + 1, revisionCards.length - 1)); setFlipped(false); }}>
                  Next →
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm font-bold mb-1">Revision complete! 🎉</p>
              <p className="text-xs text-muted-foreground">Great job reviewing your priority cards.</p>
            </div>
          )}
        </div>
      ) : mode === "browse" ? (
        <div className="space-y-3">
          {Object.entries(grouped).map(([subjectId, cards]) => (
            <Collapsible key={subjectId} defaultOpen>
              <Card className="border-none shadow-sm">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{getSubjectName(subjectId)}</span>
                    <Badge variant="secondary" className="text-[10px]">{cards.length}</Badge>
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-2">
                    {cards.map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{card.term}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{card.definition}</p>
                        </div>
                        <Button size="icon" variant="ghost" className="text-destructive h-7 w-7 shrink-0" onClick={() => handleDelete(card.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No cards match your filter.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {mode === "review" && filteredDueCards.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-3">
                <ThumbsUp className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold mb-1">All caught up! 🎉</h3>
              <p className="text-sm text-muted-foreground">No cards due{filterSubject !== "all" ? " for this subject" : ""}. Try Cram mode to review all cards.</p>
            </div>
          ) : current ? (
            <>
              <div onClick={() => setFlipped(!flipped)} className="cursor-pointer select-none">
                <Card className="border-none shadow-md min-h-[200px] flex items-center justify-center transition-all hover:shadow-lg">
                  <CardContent className="p-6 text-center w-full">
                    {!flipped ? (
                      <>
                        <Badge variant="secondary" className="text-[10px] mb-3">{getSubjectName(current.subjectId)}</Badge>
                        <p className="text-xl font-bold">{current.term}</p>
                        <p className="text-xs text-muted-foreground mt-3">Tap to reveal</p>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="text-[10px] mb-3">Answer</Badge>
                        <p className="text-sm leading-relaxed line-clamp-1">{current.definition}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentIndex + 1} / {totalCards}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" disabled={currentIndex === 0} onClick={() => { setCurrentIndex((i) => i - 1); setFlipped(false); }}>← Prev</Button>
                  <Button size="sm" variant="ghost" disabled={currentIndex >= totalCards - 1} onClick={() => { setCurrentIndex((i) => i + 1); setFlipped(false); }}>Next →</Button>
                </div>
              </div>

              {(mode === "review" || mode === "cram") && flipped && (
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleReview(1)}>
                    <ThumbsDown className="w-4 h-4 mr-1" /> Hard
                  </Button>
                  <Button variant="outline" className="border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30" onClick={() => handleReview(3)}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Okay
                  </Button>
                  <Button variant="outline" className="border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => handleReview(5)}>
                    <ThumbsUp className="w-4 h-4 mr-1" /> Easy
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No cards match your filter.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Flashcards;
