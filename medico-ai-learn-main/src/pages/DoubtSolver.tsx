import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bot, User, Plus, History, Trash2, Search, Pencil, Check, X, Copy, ImagePlus, Zap, BookOpen, Volume2, Stethoscope, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { streamChat, type Msg, type MsgContent, type ResponseMode, type AIPreferences } from "@/lib/stream";
import { type ChatConversation, createChat, generateTitle, filterChats } from "@/lib/chatStorage";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useUserSubjects } from "@/hooks/useUserSubjects";
import { courseLabel, type Course } from "@/lib/subjects";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { format } from "date-fns";

// Subject-keyword → suggested questions. Picks chips based on student's selected subjects.
const SUBJECT_SUGGESTIONS: Array<{ match: RegExp; prompts: string[] }> = [
  { match: /anatomy/i, prompts: ["Brachial plexus branches", "Cranial nerves & functions", "Blood supply of the face", "Femoral triangle contents"] },
  { match: /physiology/i, prompts: ["Cardiac cycle phases", "Action potential explained", "Renal countercurrent mechanism", "Oxygen dissociation curve"] },
  { match: /biochem/i, prompts: ["Glycolysis steps", "Urea cycle overview", "Vitamin B12 functions", "TCA cycle key enzymes"] },
  { match: /patholog/i, prompts: ["Types of necrosis", "Acute vs chronic inflammation", "Granuloma formation", "Neoplasia hallmarks"] },
  { match: /pharma/i, prompts: ["Beta blockers — uses & side effects", "Antibiotic classes overview", "NSAIDs mechanism", "Insulin types"] },
  { match: /microbio/i, prompts: ["Gram-positive vs gram-negative", "Mycobacterium tuberculosis", "HIV life cycle", "Common dental microflora"] },
  { match: /medicine/i, prompts: ["Approach to chest pain", "Diabetic ketoacidosis management", "Hypertension classification", "CHF clinical features"] },
  { match: /surgery/i, prompts: ["Appendicitis signs", "Hernia types", "Wound healing stages", "Pre-op assessment"] },
  { match: /obg|gynae|obstet/i, prompts: ["Stages of labor", "PCOS management", "Antenatal care schedule", "Postpartum hemorrhage"] },
  { match: /paediatr|pediatr/i, prompts: ["Neonatal reflexes", "Immunization schedule (India)", "Approach to febrile child", "Milestones at 1 year"] },
  { match: /ortho/i, prompts: ["Fracture healing stages", "Colles vs Smith fracture", "Compartment syndrome", "Osteoarthritis vs RA"] },
  { match: /derma/i, prompts: ["Psoriasis features", "Acne pathogenesis", "Common fungal infections", "Eczema types"] },
  { match: /psychiatr/i, prompts: ["Schizophrenia symptoms", "Major depression criteria", "Bipolar disorder types", "Anxiety disorders"] },
  { match: /ent|otorhino/i, prompts: ["Otitis media types", "Epistaxis management", "Sinusitis features", "Vertigo causes"] },
  { match: /ophthal/i, prompts: ["Cataract types", "Glaucoma classification", "Diabetic retinopathy", "Red eye differentials"] },
  { match: /forensic/i, prompts: ["Postmortem changes", "Types of asphyxia", "Wound classification", "Medico-legal autopsy"] },
  { match: /communit|psm/i, prompts: ["Epidemiological triad", "National health programs (India)", "Sampling methods", "Vaccination cold chain"] },
  // Dental
  { match: /dental anatomy|tooth/i, prompts: ["Tooth numbering systems", "Permanent vs deciduous teeth", "Cusps of maxillary 1st molar"] },
  { match: /oral histolog|embryolog/i, prompts: ["Stages of tooth development", "Ameloblast vs odontoblast", "Enamel composition"] },
  { match: /oral patholog/i, prompts: ["Leukoplakia features", "OSMF clinical signs", "Ameloblastoma types"] },
  { match: /periodont/i, prompts: ["Stages of gingivitis", "Bone loss patterns", "Scaling vs root planing"] },
  { match: /endodont|conservative/i, prompts: ["Pulp anatomy of molars", "Endodontic instruments", "RCT steps"] },
  { match: /orthodont/i, prompts: ["Angle's classification", "Cephalometric landmarks", "Removable appliances"] },
  { match: /prosthodont/i, prompts: ["Impression materials", "Complete denture steps", "Crown preparations"] },
  { match: /oral.*surg|maxillofacial/i, prompts: ["Local anesthesia techniques", "Tooth extraction principles", "Mandibular fracture types"] },
  { match: /occlusion/i, prompts: ["Centric relation vs occlusion", "Curve of Spee", "Class II occlusion"] },
  { match: /dental material/i, prompts: ["GIC properties", "Composite resin types", "Amalgam composition"] },
];

const GENERIC_FALLBACK_MBBS = ["Explain a high-yield topic", "Quick mnemonic for cranial nerves", "Common exam question on diabetes"];
const GENERIC_FALLBACK_BDS = ["Explain a high-yield dental topic", "Mnemonic for tooth numbering", "Common BDS exam question"];

function buildSuggestions(subjects: { name: string }[], course: Course): string[] {
  const out = new Set<string>();
  for (const s of subjects) {
    for (const rule of SUBJECT_SUGGESTIONS) {
      if (rule.match.test(s.name)) {
        rule.prompts.forEach(p => out.add(p));
        break;
      }
    }
    if (out.size >= 6) break;
  }
  if (out.size === 0) {
    (course === "mbbs" ? GENERIC_FALLBACK_MBBS : GENERIC_FALLBACK_BDS).forEach(p => out.add(p));
  }
  return Array.from(out).slice(0, 6);
}

function parseSourceTag(content: string) {
  const lines = content.split("\n");
  const lastLines = lines.slice(-3);
  let source = "";
  let cleanContent = content;

  for (const line of lastLines) {
    const match = line.match(/^(📖|🧠)\s*(Source|Sources?):\s*(.+)$/i);
    if (match) {
      source = line.trim();
      cleanContent = lines.filter((l) => l.trim() !== source).join("\n").trim();
      break;
    }
  }

  return { source, cleanContent };
}

function getTextContent(content: MsgContent): string {
  if (typeof content === "string") return content;
  return content.filter(c => c.type === "text").map(c => (c as any).text).join(" ");
}

function hasImageContent(content: MsgContent): string | null {
  if (typeof content === "string") return null;
  const img = content.find(c => c.type === "image_url");
  return img ? (img as any).image_url.url : null;
}

const RESPONSE_MODES: { value: ResponseMode; icon: any; label: string; shortLabel: string }[] = [
  { value: "brief", icon: Zap, label: "Brief", shortLabel: "Brief" },
  { value: "detailed", icon: BookOpen, label: "Detailed", shortLabel: "Detail" },
  { value: "brief-general", icon: Globe, label: "Brief (General)", shortLabel: "Brief 🌐" },
  { value: "detailed-general", icon: Stethoscope, label: "Detailed (General)", shortLabel: "Detail 🌐" },
];

const DoubtSolver = () => {
  const [chats, setChats] = useLocalStorage<ChatConversation[]>("doubt-chats", []);
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>("doubt-active-chat", null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useLocalStorage<ResponseMode>("doubt-response-mode", "detailed");
  const [aiPreferences] = useLocalStorage<AIPreferences>("dentai-ai-preferences", {});
  const [courseLS] = useLocalStorage<Course>("medicoai-course", "bds");
  const [yearLS] = useLocalStorage<string>("dentai-year", "");
  const userSubjects = useUserSubjects();
  const suggestions = useMemo(() => buildSuggestions(userSubjects, courseLS), [userSubjects, courseLS]);
  const chatContext = useMemo(() => ({
    course: courseLS,
    year: yearLS,
    subjects: userSubjects.map(s => ({ name: s.name, book: s.book, author: s.author })),
  }), [courseLS, yearLS, userSubjects]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const updateChatMessages = (chatId: string, msgs: Msg[], title?: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: msgs, updatedAt: new Date().toISOString(), ...(title ? { title } : {}) }
          : c
      )
    );
  };

  const handleNewChat = () => {
    const chat = createChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setHistoryOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setChats((prev) => prev.filter((c) => c.id !== deleteTarget));
    if (activeChatId === deleteTarget) setActiveChatId(null);
    setDeleteTarget(null);
  };

  const startRename = (chat: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameValue(chat.title);
  };

  const submitRename = () => {
    if (!renamingId || !renameValue.trim()) return;
    setChats((prev) =>
      prev.map((c) => (c.id === renamingId ? { ...c, title: renameValue.trim() } : c))
    );
    setRenamingId(null);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setHistoryOpen(false);
  };

  const handleCopyMessage = (content: MsgContent) => {
    navigator.clipboard.writeText(getTextContent(content));
    toast.success("Copied to clipboard!");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async (overrideInput?: string) => {
    const trimmed = (overrideInput || input).trim();
    if ((!trimmed && !pendingImage) || isLoading) return;

    let chatId = activeChatId;
    if (!chatId) {
      const chat = createChat();
      setChats((prev) => [chat, ...prev]);
      setActiveChatId(chat.id);
      chatId = chat.id;
    }

    let userContent: MsgContent;
    if (pendingImage) {
      const ctxLabel = courseLS === "mbbs" ? "MBBS studies" : "BDS / dental studies";
      userContent = [
        ...(trimmed ? [{ type: "text" as const, text: trimmed }] : [{ type: "text" as const, text: `What is this? Please explain in the context of ${ctxLabel}.` }]),
        { type: "image_url" as const, image_url: { url: pendingImage } },
      ];
    } else {
      userContent = trimmed;
    }

    const userMsg: Msg = { role: "user", content: userContent };
    const currentChat = chats.find((c) => c.id === chatId);
    const currentMessages = currentChat?.messages ?? [];
    const newMessages = [...currentMessages, userMsg];

    const isFirst = currentMessages.length === 0;
    const title = isFirst ? generateTitle(trimmed || "Image question") : undefined;

    updateChatMessages(chatId, newMessages, title);
    setInput("");
    setPendingImage(null);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const withAssistant = [...newMessages];
      const last = withAssistant[withAssistant.length - 1];
      if (last?.role === "assistant") {
        withAssistant[withAssistant.length - 1] = { ...last, content: assistantSoFar };
      } else {
        withAssistant.push({ role: "assistant", content: assistantSoFar });
      }
      updateChatMessages(chatId!, withAssistant);
    };

    try {
      await streamChat({
        messages: newMessages,
        responseMode,
        aiPreferences: aiPreferences && Object.keys(aiPreferences).length > 0 ? aiPreferences : undefined,
        context: chatContext,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
        onError: (err) => { toast.error(err); setIsLoading(false); },
      });
    } catch {
      toast.error("Failed to get response. Please try again.");
      setIsLoading(false);
    }
  };

  const filtered = filterChats(
    [...chats].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    searchQuery
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1.5 text-xs">
          <Plus className="w-4 h-4" /> New Chat
        </Button>
        <h1 className="text-sm font-semibold">Ask a Doubt</h1>
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <History className="w-4 h-4" /> History
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0 flex flex-col">
            <SheetHeader className="p-4 pb-2">
              <SheetTitle>Chat History</SheetTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9 text-sm" />
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No chats found</p>
              )}
              {filtered.map((chat) => (
                <div key={chat.id} className={`group flex items-start gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${chat.id === activeChatId ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`} onClick={() => handleSelectChat(chat.id)}>
                  <div className="flex-1 min-w-0">
                    {renamingId === chat.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") setRenamingId(null); }} className="h-7 text-sm px-1.5" autoFocus />
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={submitRename}><Check className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setRenamingId(null)}><X className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium truncate">{chat.title}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(chat.updatedAt), "MMM d, h:mm a")} · {chat.messages.length} msgs</p>
                  </div>
                  {renamingId !== chat.id && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => startRename(chat, e)}><Pencil className="h-3 w-3 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDeleteTarget(chat.id); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-2xl gradient-dental flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold mb-1">Ask MedicoAI anything!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Get answers from your {courseLabel(courseLS)} textbooks — or snap a photo of a page!
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {suggestions.map((prompt) => (
                <button key={prompt} onClick={() => send(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted hover:border-secondary transition-all text-muted-foreground hover:text-foreground">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const textContent = getTextContent(msg.content);
          const imageUrl = hasImageContent(msg.content);

          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="space-y-2">
                    {imageUrl && (
                      <img src={imageUrl} alt="User-uploaded dental diagram for doubt question" className="max-w-[200px] rounded-lg border border-border" />
                    )}
                    {textContent && (
                      <div className="rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                        {textContent}
                      </div>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          }

          const { source, cleanContent } = parseSourceTag(textContent);

          return (
            <div key={i} className="flex justify-start group">
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full gradient-dental flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-2.5 text-sm prose prose-sm max-w-none relative">
                    <ReactMarkdown>{cleanContent}</ReactMarkdown>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button onClick={() => handleCopyMessage(msg.content)}
                        className="p-1 rounded hover:bg-muted" title="Copy message">
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                      {"speechSynthesis" in window && (
                        <button onClick={() => {
                          const synth = window.speechSynthesis;
                          if (synth.speaking) { synth.cancel(); return; }
                          const utterance = new SpeechSynthesisUtterance(textContent.replace(/[#*_`]/g, ""));
                          utterance.rate = 0.9;
                          utterance.lang = "en-US";
                          synth.speak(utterance);
                        }} className="p-1 rounded hover:bg-muted" title="Read aloud">
                          <Volume2 className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                  {source && (
                    <Badge variant="secondary" className="text-[10px] font-medium">{source}</Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-7 h-7 rounded-full gradient-dental flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="typing-dots flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pending Image Preview */}
      {pendingImage && (
        <div className="px-4 py-2 border-t border-border bg-card">
          <div className="relative inline-block">
            <img src={pendingImage} alt="Pending dental diagram preview before sending" className="h-16 rounded-lg border border-border" />
            <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="flex flex-col gap-2 max-w-lg mx-auto">
          <div className="flex items-center justify-center">
            <div className="flex flex-wrap justify-center gap-1 bg-muted rounded-lg p-1">
              {RESPONSE_MODES.map(({ value, label, shortLabel }) => (
                <button
                  key={value}
                  onClick={() => setResponseMode(value)}
                  className={`text-[10px] px-2.5 py-1 rounded-md transition-all font-medium ${
                    responseMode === value
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {shortLabel}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0" title="Upload image">
              <ImagePlus className="w-4 h-4" />
            </Button>
            <Input
              placeholder={responseMode.includes("brief") ? "Ask for a quick answer..." : `Ask any ${courseLabel(courseLS)} question...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={() => send()} disabled={(!input.trim() && !pendingImage) || isLoading} size="icon" className="gradient-teal text-secondary-foreground shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this conversation. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoubtSolver;
