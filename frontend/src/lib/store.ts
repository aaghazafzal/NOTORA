import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME, type ThemeId } from "./themes";

export interface Bookmark {
  bookId: string;
  page: number;
  createdAt: string;
  label?: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  page: number;
  text: string;
  color: "yellow" | "pink" | "blue" | "green";
  note?: string;
  createdAt: string;
}

export type ShelfId = "reading" | "favorites" | "completed" | "to-read";

interface AppState {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;

  signedIn: boolean;
  currentUserId: string;
  signIn: () => void;
  signOut: () => void;

  shelves: Record<ShelfId, string[]>;
  customShelves: { id: string; name: string; bookIds: string[] }[];
  toggleShelf: (shelf: ShelfId, bookId: string) => void;
  addCustomShelf: (name: string) => void;
  toggleCustomShelf: (shelfId: string, bookId: string) => void;

  progress: Record<string, number>; // bookId -> page
  setProgress: (bookId: string, page: number) => void;

  bookmarks: Bookmark[];
  addBookmark: (b: Bookmark) => void;
  removeBookmark: (bookId: string, page: number) => void;

  highlights: Highlight[];
  addHighlight: (h: Highlight) => void;
  removeHighlight: (id: string) => void;
  updateHighlightNote: (id: string, note: string) => void;

  // Reader prefs
  readerFontSize: number;
  readerFontFamily: "serif" | "sans";
  readerLineHeight: number;
  readerTheme: "day" | "night" | "sepia";
  setReaderPref: <K extends keyof ReaderPrefs>(k: K, v: ReaderPrefs[K]) => void;
}

interface ReaderPrefs {
  readerFontSize: number;
  readerFontFamily: "serif" | "sans";
  readerLineHeight: number;
  readerTheme: "day" | "night" | "sepia";
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (t) => set({ theme: t }),

      signedIn: true,
      currentUserId: "u_maya",
      signIn: () => set({ signedIn: true }),
      signOut: () => set({ signedIn: false }),

      shelves: { reading: [], favorites: [], completed: [], "to-read": [] },
      customShelves: [],
      toggleShelf: (shelf, bookId) =>
        set((s) => {
          const list = s.shelves[shelf];
          const next = list.includes(bookId)
            ? list.filter((id) => id !== bookId)
            : [...list, bookId];
          return { shelves: { ...s.shelves, [shelf]: next } };
        }),
      addCustomShelf: (name) =>
        set((s) => ({
          customShelves: [...s.customShelves, { id: `cs_${Date.now()}`, name, bookIds: [] }],
        })),
      toggleCustomShelf: (shelfId, bookId) =>
        set((s) => ({
          customShelves: s.customShelves.map((cs) =>
            cs.id === shelfId
              ? {
                  ...cs,
                  bookIds: cs.bookIds.includes(bookId)
                    ? cs.bookIds.filter((id) => id !== bookId)
                    : [...cs.bookIds, bookId],
                }
              : cs,
          ),
        })),

      progress: {},
      setProgress: (bookId, page) => set((s) => ({ progress: { ...s.progress, [bookId]: page } })),

      bookmarks: [],
      addBookmark: (b) => set((s) => ({ bookmarks: [...s.bookmarks, b] })),
      removeBookmark: (bookId, page) =>
        set((s) => ({
          bookmarks: s.bookmarks.filter((bm) => !(bm.bookId === bookId && bm.page === page)),
        })),

      highlights: [],
      addHighlight: (h) => set((s) => ({ highlights: [...s.highlights, h] })),
      removeHighlight: (id) =>
        set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
      updateHighlightNote: (id, note) =>
        set((s) => ({
          highlights: s.highlights.map((h) => (h.id === id ? { ...h, note } : h)),
        })),

      readerFontSize: 18,
      readerFontFamily: "serif",
      readerLineHeight: 1.7,
      readerTheme: "night",
      setReaderPref: (k, v) => set({ [k]: v } as Partial<AppState>),
    }),
    {
      name: "notora-store",
    },
  ),
);
