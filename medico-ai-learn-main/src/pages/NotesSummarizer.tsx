import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, FileText, Download, FileDown, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { downloadMarkdown, downloadPDF, safeFilename } from "@/lib/exporters";

type Mode = "summary" | "cheatsheet" | "mnemonics" | "questions";

const MODES: { value: Mode; label: string }[] = [
  { value: "summary", label: "Summary" },
  { value: "cheatsheet", label: "Cheat Sheet" },
  { value: "mnemonics", label: "Mnemonics" },
  { value: "questions", label: "Q & A" },
];

export default function NotesSummarizer() {
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState<Mode>("summary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [buildingDeck, setBuildingDeck] = useState(false);
  const navigate = useNavigate();

  const title = subject ? `${subject} — ${MODES.find((m) => m.value === mode)?.label}` : `Study Sheet — ${MODES.find((m) => m.value === mode)?.label}`;
  const fileBase = safeFilename(`${subject || "notes"}-${mode}`);

  const exportMD = () => {
    downloadMarkdown(fileBase, result, { title, subject });
    toast.success("Markdown downloaded");
  };
  const exportPDFFile = () => {
    downloadPDF(fileBase, result, { title, subject });
    toast.success("PDF downloaded");
  };

  const buildPracticeDeck = async () => {
    const source = result || text;
    if (source.trim().length < 30) {
      toast.error("Need some content first");
      return;
    }
    setBuildingDeck(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }
      const { data, error } = await supabase.functions.invoke("ai-helper", {
        body: { action: "generate-cards", text: source, subject, count: 12 },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const raw = String((data as any).content ?? "").trim();
      // Strip code fences if model added them
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      let cards: { q: string; a: string }[];
      try {
        cards = JSON.parse(cleaned);
      } catch {
        throw new Error("AI returned invalid JSON. Try again.");
      }
      if (!Array.isArray(cards) || !cards.length) throw new Error("No cards generated");

      const deckId = `notes-${Date.now()}`;
      const rows = cards
        .filter((c) => c?.q && c?.a)
        .slice(0, 25)
        .map((c) => ({
          user_id: user.id,
          term: String(c.q).slice(0, 500),
          definition: String(c.a).slice(0, 2000),
          subject_id: deckId,
        }));
      const { error: insErr } = await supabase.from("user_flashcards").insert(rows);
      if (insErr) throw insErr;

      toast.success(`Created ${rows.length} cards`);
      navigate(`/practice?deck=${encodeURIComponent(deckId)}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to build deck");
    } finally {
      setBuildingDeck(false);
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large (max 2MB text)");
      return;
    }
    const t = await file.text();
    setText(t);
    toast.success("Notes loaded");
  };

  const run = async () => {
    if (text.trim().length < 30) {
      toast.error("Paste at least a paragraph of notes");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-helper", {
        body: { action: "summarize-notes", text, mode, subject },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult((data as any).content ?? "");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied");
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          AI Notes Summarizer
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste messy notes — get clean summaries, cheat sheets, mnemonics, or practice Q&A.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              placeholder="Subject (optional, e.g. Pharmacology)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <Input
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
          <Textarea
            placeholder="Paste your lecture notes, textbook excerpt, or anything you want simplified…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
          />
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid grid-cols-4 w-full">
              {MODES.map((m) => (
                <TabsTrigger key={m.value} value={m.value}>
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button onClick={run} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Generate {MODES.find((m) => m.value === mode)?.label}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" /> Result
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={exportMD}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Markdown
              </Button>
              <Button size="sm" variant="outline" onClick={exportPDFFile}>
                <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF
              </Button>
              <Button size="sm" onClick={buildPracticeDeck} disabled={buildingDeck}>
                {buildingDeck ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Brain className="w-3.5 h-3.5 mr-1.5" />
                )}
                Practice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
