export interface Flashcard {
  id: string;
  term: string;
  definition: string;
  subjectId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  createdAt: string;
}

const STORAGE_KEY = "dentai-flashcards";
import { pushToCloud } from "./syncEngine";

export function getFlashcards(): Flashcard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFlashcards(cards: Flashcard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  pushToCloud(STORAGE_KEY, cards);
}

export function addFlashcard(term: string, definition: string, subjectId: string): Flashcard {
  const cards = getFlashcards();
  const existing = cards.find((c) => c.term.toLowerCase() === term.toLowerCase() && c.subjectId === subjectId);
  if (existing) return existing;

  const card: Flashcard = {
    id: crypto.randomUUID(),
    term,
    definition,
    subjectId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  };
  cards.push(card);
  saveFlashcards(cards);
  return card;
}

export function removeFlashcard(id: string) {
  const cards = getFlashcards().filter((c) => c.id !== id);
  saveFlashcards(cards);
}

export function reviewFlashcard(id: string, quality: number) {
  const cards = getFlashcards();
  const card = cards.find((c) => c.id === id);
  if (!card) return;

  if (quality >= 3) {
    if (card.repetitions === 0) {
      card.interval = 1;
    } else if (card.repetitions === 1) {
      card.interval = 6;
    } else {
      card.interval = Math.round(card.interval * card.easeFactor);
    }
    card.repetitions += 1;
  } else {
    card.repetitions = 0;
    card.interval = 1;
  }

  card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const next = new Date();
  next.setDate(next.getDate() + card.interval);
  card.nextReview = next.toISOString().split("T")[0];

  saveFlashcards(cards);
}

export function getDueFlashcards(): Flashcard[] {
  const today = new Date().toISOString().split("T")[0];
  return getFlashcards().filter((c) => c.nextReview <= today);
}
