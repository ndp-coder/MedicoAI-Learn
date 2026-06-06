import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import type { Mistake } from "@/lib/mistakeLog";

interface ExplainMistakeButtonProps {
  mistake: Mistake;
  subjectName?: string;
}

export function ExplainMistakeButton({ mistake, subjectName }: ExplainMistakeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleExplain = async () => {
    if (explanation) {
      setExplanation(null); // toggle close
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-helper", {
        body: {
          action: "explain-mistake",
          question: mistake.question,
          options: mistake.options,
          correctIndex: mistake.correctIndex,
          subject: subjectName,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setExplanation(data.content);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to get explanation";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-[10px] h-6 px-2 mt-1 text-secondary"
        onClick={handleExplain}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Thinking...
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3 mr-1" />
            {explanation ? "Hide AI" : "AI Explain"}
          </>
        )}
      </Button>
      {explanation && (
        <div className="mt-2 p-2.5 rounded-lg bg-secondary/10 border border-secondary/30 prose prose-sm dark:prose-invert max-w-none text-[11px]">
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>
      )}
    </>
  );
}
