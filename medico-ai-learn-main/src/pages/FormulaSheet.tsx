import { useState } from "react";
import { Loader2, Printer, Copy, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const FormulaSheet = () => {
  const subjects = useUserSubjects();
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const handleGenerate = async () => {
    if (!subjectId) { toast.error("Select a subject"); return; }
    setLoading(true);
    setContent("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-formula-sheet", {
        body: { subjectId },
      });
      if (error) throw error;
      setContent(data?.content || "No content generated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate formula sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard! 📋");
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>Formula Sheet</title><style>body{font-family:system-ui;padding:2rem;max-width:800px;margin:0 auto;font-size:14px}h1,h2,h3{margin-top:1.5em}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px 10px;text-align:left}ul{padding-left:1.5em}</style></head><body>`);
      printWindow.document.write(`<h1>${subjects.find(s => s.id === subjectId)?.name} — Formula Sheet</h1>`);
      printWindow.document.write(`<div>${content.replace(/\n/g, "<br>")}</div>`);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5 animate-page-in">
      <div>
        <h2 className="text-lg font-bold">📐 Formula & Key Facts Sheet</h2>
        <p className="text-xs text-muted-foreground">AI-generated printable formula sheets</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerate} disabled={loading || !subjectId} className="w-full gradient-teal text-secondary-foreground font-semibold">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</> : <><FileText className="w-4 h-4 mr-2" /> Generate Sheet</>}
          </Button>
        </CardContent>
      </Card>

      {content && (
        <div className="space-y-3">
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs">
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} className="text-xs">
              <Printer className="w-3.5 h-3.5 mr-1" /> Print
            </Button>
          </div>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 prose prose-sm max-w-none text-sm">
              <ReactMarkdown>{content}</ReactMarkdown>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FormulaSheet;
