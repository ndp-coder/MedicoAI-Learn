import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Sparkles, Loader2, X, Wand2, Pencil, History, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { DrawCanvas, DrawCanvasHandle } from "@/components/DrawCanvas";
import { useAuth } from "@/contexts/AuthContext";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

interface DiagramRow {
  id: string;
  storage_path: string;
  source: string;
  custom_prompt: string | null;
  explanation: string | null;
  created_at: string;
  signedUrl?: string;
}

export default function DiagramExplain() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawRef = useRef<DrawCanvasHandle>(null);

  const [mode, setMode] = useState<"upload" | "draw">("upload");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [history, setHistory] = useState<DiagramRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("user_diagrams")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      toast.error("Could not load history");
      setLoadingHistory(false);
      return;
    }
    const rows = (data as DiagramRow[]) ?? [];
    // Sign URLs
    const signed = await Promise.all(
      rows.map(async (r) => {
        const { data: s } = await supabase.storage
          .from("user-diagrams")
          .createSignedUrl(r.storage_path, 3600);
        return { ...r, signedUrl: s?.signedUrl };
      }),
    );
    setHistory(signed);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setImageDataUrl(dataUrl);
    setExplanation(null);
  };

  const saveDiagram = async (dataUrl: string, source: string, explanationText: string) => {
    if (!user) return;
    try {
      const blob = dataUrlToBlob(dataUrl);
      const ext = blob.type.split("/")[1]?.split("+")[0] || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("user-diagrams")
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("user_diagrams").insert({
        user_id: user.id,
        storage_path: path,
        source,
        custom_prompt: customPrompt.trim() || null,
        explanation: explanationText,
      });
      if (insErr) throw insErr;
      loadHistory();
    } catch (e: any) {
      console.error(e);
      toast.error("Saved explanation but couldn't store diagram");
    }
  };

  const explain = async () => {
    let dataUrl = imageDataUrl;
    let source = "upload";
    if (mode === "draw") {
      if (drawRef.current?.isEmpty()) {
        toast.error("Draw something first");
        return;
      }
      dataUrl = drawRef.current?.getDataUrl() ?? null;
      source = "draw";
    }
    if (!dataUrl) {
      toast.error("Add a diagram first");
      return;
    }
    setLoading(true);
    setExplanation(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-helper", {
        body: {
          action: "explain-diagram",
          imageDataUrl: dataUrl,
          customPrompt: customPrompt.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const text = data?.content ?? "No response.";
      setExplanation(text);
      await saveDiagram(dataUrl, source, text);
    } catch (e: any) {
      toast.error(e.message || "Failed to explain diagram");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageDataUrl(null);
    setExplanation(null);
    setCustomPrompt("");
    setShowCustom(false);
  };

  const deleteDiagram = async (row: DiagramRow) => {
    if (!confirm("Delete this diagram?")) return;
    await supabase.storage.from("user-diagrams").remove([row.storage_path]);
    await supabase.from("user_diagrams").delete().eq("id", row.id);
    loadHistory();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">Diagram Explainer</h1>
        <p className="text-sm text-muted-foreground">
          Upload or draw a diagram — get an AI explanation + memory hook
        </p>
      </div>

      <Card className="p-4 md:p-6 space-y-4">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setExplanation(null); }}>
          <TabsList className="grid grid-cols-2 w-full max-w-sm mx-auto">
            <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload</TabsTrigger>
            <TabsTrigger value="draw"><Pencil className="w-4 h-4 mr-2" />Draw</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            {!imageDataUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <div className="text-sm font-medium">Click to upload a diagram</div>
                <div className="text-xs text-muted-foreground">PNG, JPG, WEBP · up to 8MB</div>
              </button>
            ) : (
              <div className="relative">
                <img
                  src={imageDataUrl}
                  alt="Uploaded diagram"
                  className="w-full max-h-[400px] object-contain rounded-lg bg-muted"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={reset}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </TabsContent>

          <TabsContent value="draw" className="mt-4">
            <DrawCanvas ref={drawRef} height={420} />
            <p className="text-xs text-muted-foreground mt-2">
              Tip: use the pen tool with different colors and brush sizes. Undo/redo and clear are available.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button onClick={explain} disabled={loading} className="flex-1 min-w-[160px]">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Explaining…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Explain</>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowCustom((v) => !v)} disabled={loading}>
            <Wand2 className="w-4 h-4 mr-2" />
            {showCustom ? "Hide custom prompt" : "Custom prompt"}
          </Button>
        </div>

        {showCustom && (
          <Textarea
            placeholder="e.g. Explain only the nerve supply, or compare with the maxillary version…"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            maxLength={500}
          />
        )}
      </Card>

      {explanation && (
        <Card className="p-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <History className="w-4 h-4" /> My Saved Diagrams
          {history.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({history.length})</span>
          )}
        </div>
        {loadingHistory ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : history.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Explained diagrams will be saved here automatically.
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {history.map((row) => (
              <Card key={row.id} className="overflow-hidden group">
                {row.signedUrl && (
                  <img
                    src={row.signedUrl}
                    alt="Saved diagram"
                    className="w-full h-32 object-contain bg-muted"
                  />
                )}
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {row.source} · {new Date(row.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => deleteDiagram(row)}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 rounded p-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {row.explanation && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {row.explanation.replace(/[#*_`]/g, "").slice(0, 100)}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-7 text-xs"
                    onClick={() => {
                      setImageDataUrl(row.signedUrl ?? null);
                      setMode("upload");
                      setExplanation(row.explanation ?? null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
