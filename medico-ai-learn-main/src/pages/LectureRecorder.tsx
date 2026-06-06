import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mic, Square, Upload, Sparkles, Copy, Download, FileDown, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { downloadMarkdown, downloadPDF, safeFilename } from "@/lib/exporters";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

export default function LectureRecorder() {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const tickRef = useRef<number | null>(null);
  const [buildingDeck, setBuildingDeck] = useState(false);
  const navigate = useNavigate();

  const fileBase = safeFilename(`lecture-${new Date().toISOString().slice(0, 10)}`);
  const exportMD = () => {
    downloadMarkdown(fileBase, result, { title: "Lecture Notes" });
    toast.success("Markdown downloaded");
  };
  const exportPDFFile = () => {
    downloadPDF(fileBase, result, { title: "Lecture Notes" });
    toast.success("PDF downloaded");
  };
  const buildPracticeDeck = async () => {
    if (!result) return;
    setBuildingDeck(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }
      const { data, error } = await supabase.functions.invoke("ai-helper", {
        body: { action: "generate-cards", text: result, count: 12 },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const raw = String((data as any).content ?? "").trim();
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      let cards: { q: string; a: string }[];
      try {
        cards = JSON.parse(cleaned);
      } catch {
        throw new Error("AI returned invalid JSON. Try again.");
      }
      if (!Array.isArray(cards) || !cards.length) throw new Error("No cards generated");
      const deckId = `lecture-${Date.now()}`;
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

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
      setElapsed(0);
      setResult("");
      tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e: any) {
      toast.error("Microphone permission denied");
    }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const onUpload = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Audio too large (max 20MB)");
      return;
    }
    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
    setResult("");
  };

  const transcribe = async () => {
    if (!audioBlob) return;
    if (audioBlob.size > 20 * 1024 * 1024) {
      toast.error("Recording too long (max ~20MB). Try a shorter clip.");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const dataUrl = await blobToDataUrl(audioBlob);
      const { data, error } = await supabase.functions.invoke("ai-helper", {
        body: {
          action: "transcribe-lecture",
          audioDataUrl: dataUrl,
          mimeType: audioBlob.type || "audio/webm",
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult((data as any).content ?? "");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to transcribe");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary" />
          Lecture Recorder
        </h1>
        <p className="text-sm text-muted-foreground">
          Record a lecture or upload audio — AI gives you a transcript, structured notes, key terms, and practice questions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-center flex-col gap-3 py-6 border-2 border-dashed rounded-lg">
            <div className="text-3xl font-mono tabular-nums">{fmt(elapsed)}</div>
            {!recording ? (
              <Button onClick={start} size="lg" className="rounded-full h-16 w-16 p-0">
                <Mic className="w-6 h-6" />
              </Button>
            ) : (
              <Button onClick={stop} size="lg" variant="destructive" className="rounded-full h-16 w-16 p-0">
                <Square className="w-6 h-6" />
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {recording ? "Recording… tap to stop" : "Tap to start recording"}
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <label className="flex items-center justify-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-accent">
            <Upload className="w-4 h-4" />
            <span className="text-sm">Upload audio file (mp3, wav, m4a, webm)</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            />
          </label>

          {audioUrl && (
            <div className="space-y-3">
              <audio src={audioUrl} controls className="w-full" />
              <Button onClick={transcribe} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transcribing & summarizing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Transcribe & make notes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
            <CardTitle className="text-base">Notes</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  toast.success("Copied");
                }}
              >
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
