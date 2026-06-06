export interface BookmarkedQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  bookReference: string;
  subjectId: string;
  userAnswer: number;
  savedAt: string;
}

const STORAGE_KEY = "dentai-bookmarks";
import { syncToCloud } from "./syncEngine";

export function getBookmarks(): BookmarkedQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: BookmarkedQuestion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  syncToCloud("bookmarks", () => bookmarks);
}

export function addBookmark(q: Omit<BookmarkedQuestion, "id" | "savedAt">): BookmarkedQuestion {
  const bookmarks = getBookmarks();
  const exists = bookmarks.find((b) => b.question === q.question);
  if (exists) return exists;

  const bookmark: BookmarkedQuestion = {
    ...q,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };
  bookmarks.push(bookmark);
  saveBookmarks(bookmarks);
  return bookmark;
}

export function removeBookmark(id: string) {
  saveBookmarks(getBookmarks().filter((b) => b.id !== id));
}

export function getBookmarksBySubject(subjectId: string): BookmarkedQuestion[] {
  return getBookmarks().filter((b) => b.subjectId === subjectId);
}
