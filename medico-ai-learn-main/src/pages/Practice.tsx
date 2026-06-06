import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, Check, X, AlertCircle, Sparkles, RotateCcw } from "lucide-react";

type FlashCard = {
  id: string;
  term: string;
  definition: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
};

// SM-2 scheduling. quality: 0 (missed) | 3 (almost) | 5 (got it)
function sm2(card: FlashCard, quality: 0 | 3 | 5) {
  let ef = card.ease_factor ?? 2.5;
  let reps = card.repetitions ?? 0;
  let interval = card.interval ?? 0;

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ef);
  }
  ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const next = new Date();
  next.setDate(next.getDate() + interval);
  return { ease_factor: ef, repetitions: reps, interval, next_review: next.toISOString() };
}

export default function Practice() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const deck = params.get("deck") ?? "";
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ got: 0, almost: 0, missed: 0 });
  const [done, setDone] = useState(false);

  const loadDeck = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      navigate("/auth");
      return;
    }
    let query = supabase
      .from("user_flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("next_review", { ascending: true });
    if (deck) query = query.eq("subject_id", deck);
    else query = query.lte("next_review", new Date().toISOString());

    const { data, error } = await query.limit(40);
    if (error) {
      toast.error(error.message);
    } else {
      setCards((data ?? []) as FlashCard[]);
    }
    setIdx(0);
    setRevealed(false);
    setStats({ got: 0, almost: 0, missed: 0 });
    setDone(false);
    setLoading(false);
  };

  useEffect(() => {
    loadDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck]);

  const current = cards[idx];
  const total = cards.length;
  const progress = total ? Math.round(((idx + (revealed ? 0.5 : 0)) / total) * 100) : 0;

  const rate = async (quality: 0 | 3 | 5) => {
    if (!current) return;
    const update = sm2(current, quality);
    const { error } = await supabase.from("user_flashcards").update(update).eq("id", current.id);
    if (error) toast.error(error.message);

    setStats((s) => ({
      got: s.got + (quality === 5 ? 1 : 0),
      almost: s.almost + (quality === 3 ? 1 : 0),
      missed: s.missed + (quality === 0 ? 1 : 0),
    }));

    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setRevealed(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!total) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">No cards due</h2>
            <p className="text-sm text-muted-foreground">
              {deck
                ? "This deck is empty or already mastered for today."
                : "You're all caught up. Generate a deck from your summaries to practice more."}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate("/summarizer")}>Go to Summarizer</Button>
              <Button variant="outline" onClick={() => navigate("/flashcards")}>
                Manage Flashcards
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((stats.got / total) * 100);
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Session complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl font-bold text-primary">{pct}%</div>
              <p className="text-sm text-muted-foreground">got it on first try</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-green-500/10 p-3">
                <div className="text-xl font-bold text-green-600">{stats.got}</div>
                <div className="text-xs text-muted-foreground">Got it</div>
              </div>
              <div className="rounded-md bg-yellow-500/10 p-3">
                <div className="text-xl font-bold text-yellow-600">{stats.almost}</div>
                <div className="text-xs text-muted-foreground">Almost</div>
              </div>
              <div className="rounded-md bg-red-500/10 p-3">
                <div className="text-xl font-bold text-red-600">{stats.missed}</div>
                <div className="text-xs text-muted-foreground">Missed</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadDeck} className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" /> Practice again
              </Button>
              <Button variant="outline" onClick={() => navigate("/summarizer")} className="flex-1">
                New deck
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {idx + 1} / {total}
        </Badge>
        <div className="flex gap-1">
          <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/15">✓ {stats.got}</Badge>
          <Badge className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/15">~ {stats.almost}</Badge>
          <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/15">✗ {stats.missed}</Badge>
        </div>
      </div>
      <Progress value={progress} />

      <Card className="min-h-[260px]">
        <CardHeader>
          <CardTitle className="text-xs uppercase text-muted-foreground tracking-wide">Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-medium leading-relaxed">{current.term}</p>

          {revealed ? (
            <div className="rounded-md border border-dashed bg-muted/30 p-4 space-y-1">
              <div className="text-xs uppercase text-muted-foreground tracking-wide">Answer</div>
              <p className="text-base leading-relaxed">{current.definition}</p>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setRevealed(true)}>
              <Eye className="w-4 h-4 mr-2" /> Reveal answer
            </Button>
          )}
        </CardContent>
      </Card>

      {revealed && (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="destructive" onClick={() => rate(0)}>
            <X className="w-4 h-4 mr-1" /> Missed
          </Button>
          <Button variant="outline" onClick={() => rate(3)} className="border-yellow-500/40">
            <AlertCircle className="w-4 h-4 mr-1" /> Almost
          </Button>
          <Button onClick={() => rate(5)} className="bg-green-600 hover:bg-green-600/90">
            <Check className="w-4 h-4 mr-1" /> Got it
          </Button>
        </div>
      )}
    </div>
  );
}
