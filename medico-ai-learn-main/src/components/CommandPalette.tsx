import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Home, MessageCircle, BookOpen, RefreshCw, Layers, Target, FileText, Lightbulb, Timer, Bookmark, Settings2, StickyNote, CalendarDays, Search, Plus } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { getNotes } from "@/lib/notes";

const pages = [
  { name: "Home / Dashboard", icon: Home, path: "/" },
  { name: "Ask a Doubt", icon: MessageCircle, path: "/doubt" },
  { name: "Daily Quiz", icon: BookOpen, path: "/quiz" },
  { name: "Topic Recap", icon: RefreshCw, path: "/recap" },
  { name: "Flashcards", icon: Layers, path: "/flashcards" },
  { name: "Study Notes", icon: StickyNote, path: "/notes" },
  { name: "Study Plan", icon: CalendarDays, path: "/study-plan" },
  { name: "Study Goals", icon: Target, path: "/goals" },
  { name: "Test Marks", icon: FileText, path: "/marks" },
  { name: "Pomodoro Timer", icon: Timer, path: "/timer" },
  { name: "Bookmarks", icon: Bookmark, path: "/bookmarks" },
  { name: "Study Tips", icon: Lightbulb, path: "/suggestions" },
  { name: "Settings", icon: Settings2, path: "/settings" },
];

const quickActions = [
  { name: "New Chat", icon: Plus, path: "/doubt", desc: "Start a new doubt conversation" },
  { name: "Take a Quiz", icon: BookOpen, path: "/quiz", desc: "Generate a new quiz" },
  { name: "Create Note", icon: StickyNote, path: "/notes", desc: "Write a new study note" },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();

  const recentNotes = useMemo(() => {
    return getNotes().slice(0, 5);
  }, [open]);

  const recentChats = useMemo(() => {
    try {
      const raw = localStorage.getItem("doubt-chats");
      const chats = raw ? JSON.parse(raw) : [];
      return chats.slice(0, 5).map((c: any) => ({ id: c.id, title: c.title }));
    } catch { return []; }
  }, [open]);

  const runAction = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, notes, chats..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem key={action.name} onSelect={() => runAction(action.path)}>
              <action.icon className="mr-2 h-4 w-4" />
              <div>
                <span>{action.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{action.desc}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem key={page.path} onSelect={() => runAction(page.path)}>
              <page.icon className="mr-2 h-4 w-4" />
              <span>{page.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {recentChats.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Chats">
              {recentChats.map((chat: any) => (
                <CommandItem key={chat.id} onSelect={() => { localStorage.setItem("doubt-active-chat", JSON.stringify(chat.id)); runAction("/doubt"); }}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>{chat.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {recentNotes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Notes">
              {recentNotes.map((note) => (
                <CommandItem key={note.id} onSelect={() => runAction("/notes")}>
                  <StickyNote className="mr-2 h-4 w-4" />
                  <span>{note.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
