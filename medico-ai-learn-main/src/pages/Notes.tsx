import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Search, Trash2, Save, StickyNote, ChevronLeft, Download, Copy, Share2, Upload, FileText, Camera, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getNotes, addNote, updateNote, deleteNote, searchNotes, type StudyNote } from "@/lib/notes";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const NOTE_TEMPLATES: Record<string, { title: string; content: string }> = {
  lecture: { title: "Lecture Notes", content: "## Topic:\n\n## Key Points:\n1. \n2. \n3. \n\n## Important Diagrams:\n\n## Questions to Review:\n\n## Summary:\n" },
  lab: { title: "Lab Notes", content: "## Experiment/Procedure:\n\n## Objective:\n\n## Materials Used:\n\n## Steps:\n1. \n2. \n3. \n\n## Observations:\n\n## Conclusion:\n" },
  clinical: { title: "Clinical Notes", content: "## Patient Case:\n\n## Chief Complaint:\n\n## History:\n\n## Clinical Findings:\n\n## Diagnosis:\n\n## Treatment Plan:\n\n## Learning Points:\n" },
};

const Notes = () => {
  const subjects = useUserSubjects();
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [showTemplates, setShowTemplates] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSubject, setEditSubject] = useState("");

  const refresh = () => setNotes(getNotes());
  useEffect(() => {
    refresh();
    const params = new URLSearchParams(window.location.search);
    const noteData = params.get("import");
    if (noteData) {
      try {
        const decoded = JSON.parse(atob(noteData));
        if (decoded.title && decoded.content) {
          const note = addNote(decoded.subjectId || subjects[0]?.id || "", decoded.title, decoded.content);
          refresh();
          setActiveNote(note);
          setEditTitle(note.title);
          setEditContent(note.content);
          setEditSubject(note.subjectId);
          toast.success("Note imported! 📥");
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch { /* ignore */ }
    }
  }, []);

  const filtered = useMemo(() => {
    let result = searchQuery ? searchNotes(searchQuery) : notes;
    if (filterSubject !== "all") result = result.filter(n => n.subjectId === filterSubject);
    return result;
  }, [notes, searchQuery, filterSubject]);

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name ?? id;

  const handleCreate = () => {
    setIsCreating(true);
    setActiveNote(null);
    setEditTitle("");
    setEditContent("");
    setEditSubject(subjects[0]?.id || "");
  };

  const handleCreateFromTemplate = (key: string) => {
    const template = NOTE_TEMPLATES[key];
    setIsCreating(true);
    setActiveNote(null);
    setEditTitle(template.title);
    setEditContent(template.content);
    setEditSubject(subjects[0]?.id || "");
    setShowTemplates(false);
  };

  const handleSaveNew = () => {
    if (!editTitle.trim() || !editSubject) {
      toast.error("Title and subject are required");
      return;
    }
    addNote(editSubject, editTitle.trim(), editContent);
    setIsCreating(false);
    refresh();
    toast.success("Note saved! 📝");
  };

  const handleSelectNote = (note: StudyNote) => {
    setActiveNote(note);
    setIsCreating(false);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSubject(note.subjectId);
  };

  const handleUpdateNote = () => {
    if (!activeNote || !editTitle.trim()) return;
    updateNote(activeNote.id, editTitle.trim(), editContent);
    refresh();
    toast.success("Note updated!");
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    if (activeNote?.id === id) { setActiveNote(null); }
    refresh();
    toast.success("Note deleted");
  };

  const handleBack = () => { setActiveNote(null); setIsCreating(false); };

  const handleCopyNote = () => {
    const text = `# ${editTitle}\n\nSubject: ${getSubjectName(editSubject)}\n\n${editContent}`;
    navigator.clipboard.writeText(text);
    toast.success("Note copied as markdown! 📋");
  };

  const handleShareNote = () => {
    try {
      const data = { title: editTitle, content: editContent, subjectId: editSubject };
      const encoded = btoa(JSON.stringify(data));
      const url = `${window.location.origin}/notes?import=${encoded}`;
      navigator.clipboard.writeText(url);
      toast.success("Share link copied! 🔗");
    } catch {
      toast.error("Note too large to share as URL");
    }
  };

  const handleExportNote = () => {
    const text = `# ${editTitle}\nSubject: ${getSubjectName(editSubject)}\nDate: ${activeNote ? format(new Date(activeNote.updatedAt), "PPP") : format(new Date(), "PPP")}\n\n${editContent}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editTitle.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Note exported! 📄");
  };

  const handleExportAllBySubject = () => {
    const grouped: Record<string, StudyNote[]> = {};
    notes.forEach(n => {
      if (!grouped[n.subjectId]) grouped[n.subjectId] = [];
      grouped[n.subjectId].push(n);
    });
    
    let text = "# MedicoAI Study Notes Export\n\n";
    Object.entries(grouped).forEach(([subId, subNotes]) => {
      text += `## ${getSubjectName(subId)}\n\n`;
      subNotes.forEach(n => {
        text += `### ${n.title}\n${n.content}\n\n---\n\n`;
      });
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "MedicoAI_Study_Notes.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("All notes exported! 📄");
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setOcrLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("generate-ocr", {
        body: { imageBase64: base64, mimeType: file.type },
      });

      if (error) throw error;
      if (data?.text) {
        setIsCreating(true);
        setActiveNote(null);
        setEditTitle("Handwritten Notes - " + format(new Date(), "MMM d, h:mm a"));
        setEditContent(data.text);
        setEditSubject(subjects[0]?.id || "");
        toast.success("Text extracted! Edit and save your notes 📝");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to extract text from image");
    } finally {
      setOcrLoading(false);
    }
  };

  if (activeNote || isCreating) {
    return (
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h2 className="text-sm font-bold flex-1">{isCreating ? "New Note" : "Edit Note"}</h2>
          {(activeNote || editContent) && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShareNote} title="Share note link">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyNote} title="Copy as markdown">
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportNote} title="Export as text file">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <Select value={editSubject} onValueChange={setEditSubject}>
          <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input
          placeholder="Note title..."
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="text-lg font-semibold"
        />

        <Textarea
          placeholder="Write your notes here... Supports plain text."
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={12}
          className="resize-none"
        />

        <div className="flex gap-2">
          <Button onClick={isCreating ? handleSaveNew : handleUpdateNote} className="flex-1 gradient-teal text-secondary-foreground font-semibold">
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          {activeNote && (
            <Button variant="outline" className="text-destructive" onClick={() => handleDeleteNote(activeNote.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Study Notes</h2>
          <p className="text-xs text-muted-foreground">{notes.length} notes</p>
        </div>
        <div className="flex gap-1">
          {notes.length > 0 && (
            <Button size="sm" variant="ghost" onClick={handleExportAllBySubject} className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> Export All
            </Button>
          )}
          <input type="file" ref={ocrInputRef} accept="image/*" capture="environment" onChange={handleOCR} className="hidden" />
          <Button size="sm" variant="outline" onClick={() => ocrInputRef.current?.click()} disabled={ocrLoading} className="text-xs">
            {ocrLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Camera className="w-3.5 h-3.5 mr-1" />}
            {ocrLoading ? "Scanning..." : "Scan"}
          </Button>
          <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs">
                <FileText className="w-3.5 h-3.5 mr-1" /> Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader><DialogTitle>Note Templates</DialogTitle></DialogHeader>
              <div className="space-y-2 mt-2">
                {Object.entries(NOTE_TEMPLATES).map(([key, tmpl]) => (
                  <Button key={key} variant="outline" className="w-full justify-start text-xs" onClick={() => handleCreateFromTemplate(key)}>
                    {key === "lecture" && "📖 "}
                    {key === "lab" && "🔬 "}
                    {key === "clinical" && "🏥 "}
                    {tmpl.title}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={handleCreate} className="gradient-teal text-secondary-foreground font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1" /> New
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
            <StickyNote className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {notes.length === 0 ? "No notes yet. Create your first note!" : "No matching notes found"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(note => (
            <Card key={note.id} className="border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectNote(note)}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{note.content.slice(0, 80) || "Empty note"}</p>
                  </div>
                  <Badge variant="secondary" className="text-[9px] shrink-0">{getSubjectName(note.subjectId)}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">{format(new Date(note.updatedAt), "MMM d, h:mm a")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;
