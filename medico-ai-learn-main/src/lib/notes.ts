const STORAGE_KEY = "dentai-study-notes";
import { pushToCloud } from "./syncEngine";

export interface StudyNote {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export function getNotes(): StudyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: StudyNote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  pushToCloud(STORAGE_KEY, notes);
}

export function addNote(subjectId: string, title: string, content: string): StudyNote {
  const notes = getNotes();
  const note: StudyNote = {
    id: crypto.randomUUID(),
    subjectId,
    title,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  notes.unshift(note);
  saveNotes(notes);
  return note;
}

export function updateNote(id: string, title: string, content: string) {
  const notes = getNotes();
  const idx = notes.findIndex(n => n.id === id);
  if (idx >= 0) {
    notes[idx] = { ...notes[idx], title, content, updatedAt: new Date().toISOString() };
    saveNotes(notes);
  }
}

export function deleteNote(id: string) {
  const notes = getNotes().filter(n => n.id !== id);
  saveNotes(notes);
}

export function searchNotes(query: string): StudyNote[] {
  const q = query.toLowerCase();
  return getNotes().filter(n =>
    n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  );
}
