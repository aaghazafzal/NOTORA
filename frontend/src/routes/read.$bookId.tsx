import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Bookmark,
  BookmarkPlus,
  Settings2,
  Volume2,
  VolumeX,
  Highlighter,
  Search as SearchIcon,
} from "lucide-react";
import { bookBySlug } from "@/data/books";
import type { Book } from "@/data/books";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppStore, type Highlight } from "@/lib/store";
import { toast } from "sonner";

const RealBookReader = lazy(() => import("@/components/RealBookReader"));

export const Route = createFileRoute("/read/$bookId")({
  loader: async ({ params }) => {
    let book = bookBySlug(params.bookId) || (await fetch(`http://localhost:9090/api/books/${params.bookId}`).then(r => r.json()).then(b => b.error ? null : {
      id: b._id,
      slug: b._id,
      title: b.title,
      authorId: "u_real",
      authorName: b.author,
      description: b.description,
      genre: b.genre,
      tags: b.tags || [],
      language: b.language || "English",
      isbn: "000-0000000000",
      publishedYear: 2024,
      pages: 300,
      rating: 4.8,
      ratingCount: 1500,
      downloads: 120,
      formats: ["pdf"],
      chapters: [
        { 
          title: "Introduction", 
          paragraphs: [
            "This book is being loaded from our MongoDB database and Telegram cloud storage.", 
            "The actual file is available to download or stream from the backend API: http://localhost:9090/api/download/" + b._id,
            "Currently, this custom reading interface uses this placeholder text because parsing a real PDF or EPUB into HTML paragraphs requires a dedicated library like pdf.js or epub.js.",
            "But all the features—TTS, highlights, font changes, and themes—will work on this text just like a real parsed book!"
          ] 
        },
        { 
          title: "Chapter 1", 
          paragraphs: [
            "The city breathed in the color of graphite that morning, and the trams whispered along tracks slick with rain.", 
            "There is a particular kind of silence that lives inside a library after closing time. It is not empty. It is dense, layered, patient — the sound of thousands of held breaths waiting to be exhaled by the first reader in the morning."
          ] 
        }
      ],
      coverUrl: b.coverUrl,
    }).catch(() => null));
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Reading: ${loaderData.book.title} — LumenPages`
          : "Reader — LumenPages",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Book not found</h1>
        <Button asChild className="mt-4">
          <Link to="/browse">Back to browse</Link>
        </Button>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">Reader crashed</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset} className="mt-4">
          Try again
        </Button>
      </div>
    </div>
  ),
  component: ReaderPage,
});

// Flatten book into "pages" using paragraphs, ~2 paragraphs per page.
function pageStructure(book: Book) {
  const pages: { chapterIndex: number; text: string[] }[] = [];
  book.chapters.forEach((ch, ci) => {
    // first page of chapter includes title marker (handled in render)
    for (let i = 0; i < ch.paragraphs.length; i += 2) {
      pages.push({
        chapterIndex: ci,
        text: ch.paragraphs.slice(i, i + 2),
      });
    }
  });
  return pages;
}

function ReaderPage() {
  const { book } = Route.useLoaderData();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const pages = useMemo(() => pageStructure(book), [book]);
  const totalPages = pages.length;

  const savedProgress = useAppStore((s) => s.progress[book.id] ?? 0);
  const setProgress = useAppStore((s) => s.setProgress);
  const allBookmarks = useAppStore((s) => s.bookmarks);
  const bookmarks = useMemo(() => allBookmarks.filter((b) => b.bookId === book.id), [allBookmarks, book.id]);
  const addBookmark = useAppStore((s) => s.addBookmark);
  const removeBookmark = useAppStore((s) => s.removeBookmark);
  const allHighlights = useAppStore((s) => s.highlights);
  const highlights = useMemo(() => allHighlights.filter((h) => h.bookId === book.id), [allHighlights, book.id]);
  const addHighlight = useAppStore((s) => s.addHighlight);

  const fontSize = useAppStore((s) => s.readerFontSize);
  const fontFamily = useAppStore((s) => s.readerFontFamily);
  const lineHeight = useAppStore((s) => s.readerLineHeight);
  const readerTheme = useAppStore((s) => s.readerTheme);
  const setPref = useAppStore((s) => s.setReaderPref);

  const [page, setPage] = useState(savedProgress);
  const [selected, setSelected] = useState("");
  const [ttsOn, setTtsOn] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const clamp = (p: number) => Math.max(0, Math.min(totalPages - 1, p));
  const go = (p: number) => setPage(clamp(p));

  useEffect(() => {
    setProgress(book.id, page);
  }, [page, book.id, setProgress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPages]);

  // TTS
  useEffect(() => {
    if (!ttsOn) {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      return;
    }
    if (typeof window === "undefined") return;
    const text = pages[page]?.text.join(" ") ?? "";
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return () => window.speechSynthesis.cancel();
  }, [ttsOn, page, pages]);

  useEffect(() => () => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  const currentChapter = book.chapters[pages[page]?.chapterIndex ?? 0];
  const progress = ((page + 1) / totalPages) * 100;
  const isBookmarked = bookmarks.some((b) => b.page === page);

  const themeStyles: Record<string, React.CSSProperties> = {
    day: { backgroundColor: "#FAF8F3", color: "#1E1E1E" },
    night: { backgroundColor: "#12121C", color: "#E8E8F0" },
    sepia: { backgroundColor: "#F4ECD8", color: "#3B2E1C" },
  };

  const captureSelection = () => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection?.();
    const t = sel?.toString().trim() ?? "";
    if (t) setSelected(t);
  };

  const saveHighlight = (color: Highlight["color"]) => {
    if (!selected) return;
    addHighlight({
      id: `h_${Date.now()}`,
      bookId: book.id,
      page,
      text: selected,
      color,
      createdAt: new Date().toISOString(),
    });
    setSelected("");
    toast.success("Highlight saved");
    if (typeof window !== "undefined") window.getSelection?.()?.removeAllRanges();
  };

  const searchMatches = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return [];
    return pages
      .map((p, i) => ({
        idx: i,
        chapter: book.chapters[p.chapterIndex].title,
        snippet: p.text.find((t) => t.toLowerCase().includes(q)) ?? "",
      }))
      .filter((r) => r.snippet);
  }, [searchQ, pages, book.chapters]);

  if (book.authorId === "u_real") {
    if (!isMounted) return null;
    return (
      <Suspense fallback={<div className="h-dvh w-full bg-[#12121C] text-white flex items-center justify-center">Loading viewer...</div>}>
        <RealBookReader book={book} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-dvh" style={themeStyles[readerTheme]}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur-md sm:px-4"
        style={{
          backgroundColor:
            readerTheme === "night"
              ? "rgba(18,18,28,0.85)"
              : readerTheme === "sepia"
                ? "rgba(244,236,216,0.85)"
                : "rgba(250,248,243,0.85)",
          borderColor: "rgba(128,128,128,0.15)",
        }}
      >
        <Button asChild variant="ghost" size="icon" aria-label="Close reader">
          <Link to="/book/$bookId" params={{ bookId: book.slug }}>
            <X className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{book.title}</div>
          <div className="truncate text-xs opacity-70">
            {currentChapter?.title}
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Search in book">
              <SearchIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Search in book</SheetTitle>
            </SheetHeader>
            <Input
              autoFocus
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Find a phrase…"
              className="mt-4"
            />
            <ul className="mt-4 space-y-2">
              {searchMatches.map((m) => (
                <li key={m.idx}>
                  <button
                    onClick={() => go(m.idx)}
                    className="w-full rounded-lg border border-border p-3 text-left text-sm hover:bg-accent"
                  >
                    <div className="text-xs font-semibold opacity-70">
                      {m.chapter} · p.{m.idx + 1}
                    </div>
                    <div className="mt-1 line-clamp-3">{m.snippet}</div>
                  </button>
                </li>
              ))}
              {searchQ && searchMatches.length === 0 && (
                <li className="text-sm opacity-60">No matches</li>
              )}
            </ul>
          </SheetContent>
        </Sheet>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Contents">
              <List className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Contents</SheetTitle>
            </SheetHeader>
            <ul className="mt-4 space-y-1">
              {book.chapters.map((ch: { title: string }, i: number) => {
                const firstPage = pages.findIndex((p) => p.chapterIndex === i);
                return (
                  <li key={i}>
                    <button
                      onClick={() => go(firstPage)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {ch.title}
                    </button>
                  </li>
                );
              })}
            </ul>

            {bookmarks.length > 0 && (
              <>
                <h3 className="mt-6 font-display text-xs font-semibold uppercase tracking-wider opacity-70">
                  Bookmarks
                </h3>
                <ul className="mt-2 space-y-1">
                  {bookmarks.map((b) => (
                    <li key={b.page}>
                      <button
                        onClick={() => go(b.page)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <Bookmark className="h-4 w-4" />
                        Page {b.page + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {highlights.length > 0 && (
              <>
                <h3 className="mt-6 font-display text-xs font-semibold uppercase tracking-wider opacity-70">
                  Highlights
                </h3>
                <ul className="mt-2 space-y-2">
                  {highlights.map((h) => (
                    <li
                      key={h.id}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <button
                        onClick={() => go(h.page)}
                        className="text-left"
                      >
                        <div className="text-xs opacity-70">
                          Page {h.page + 1}
                        </div>
                        <div className="mt-1 italic">"{h.text}"</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </SheetContent>
        </Sheet>

        <Button
          variant="ghost"
          size="icon"
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          onClick={() => {
            if (isBookmarked) {
              removeBookmark(book.id, page);
              toast.success("Bookmark removed");
            } else {
              addBookmark({
                bookId: book.id,
                page,
                createdAt: new Date().toISOString(),
              });
              toast.success("Page bookmarked");
            }
          }}
        >
          {isBookmarked ? (
            <Bookmark className="h-5 w-5 fill-current" />
          ) : (
            <BookmarkPlus className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label={ttsOn ? "Stop reading aloud" : "Read aloud"}
          onClick={() => setTtsOn((v) => !v)}
        >
          {ttsOn ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Reader settings">
              <Settings2 className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-4">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-70">
                Reader theme
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["day", "night", "sepia"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPref("readerTheme", t)}
                    className={`rounded-lg border p-3 text-xs font-medium capitalize ${
                      readerTheme === t
                        ? "border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                    style={themeStyles[t]}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Font
                </span>
                <span>{fontFamily}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["serif", "sans"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPref("readerFontFamily", f)}
                    className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                      fontFamily === f
                        ? "border-primary bg-accent"
                        : "border-border"
                    }`}
                    style={{
                      fontFamily:
                        f === "serif" ? "Lora, Georgia, serif" : "Inter, sans-serif",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Text size
                </span>
                <span>{fontSize}px</span>
              </div>
              <Slider
                value={[fontSize]}
                min={14}
                max={26}
                step={1}
                onValueChange={(v) => setPref("readerFontSize", v[0])}
              />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider opacity-70">
                  Line height
                </span>
                <span>{lineHeight.toFixed(1)}</span>
              </div>
              <Slider
                value={[lineHeight * 10]}
                min={12}
                max={22}
                step={1}
                onValueChange={(v) => setPref("readerLineHeight", v[0] / 10)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 py-10 sm:py-16">
        {pages[page]?.text.some(
          (_, i) =>
            i === 0 &&
            pages[page].chapterIndex !== pages[page - 1]?.chapterIndex
        ) && (
          <h2
            className="mb-8 font-display text-2xl font-bold sm:text-3xl"
            style={{ color: "inherit" }}
          >
            {currentChapter?.title}
          </h2>
        )}
        <div
          ref={contentRef}
          onMouseUp={captureSelection}
          onTouchEnd={captureSelection}
          className="space-y-5"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight,
            fontFamily:
              fontFamily === "serif"
                ? "Lora, Georgia, serif"
                : "Inter, ui-sans-serif, system-ui",
          }}
        >
          {pages[page]?.text.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {selected && (
          <div
            className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-popover px-3 py-2 shadow-xl"
            style={{ color: "var(--popover-foreground)" }}
          >
            <div className="flex items-center gap-2">
              <Highlighter className="h-4 w-4" />
              <span className="text-xs opacity-70">Highlight:</span>
              {(["yellow", "pink", "blue", "green"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => saveHighlight(c)}
                  aria-label={`Highlight ${c}`}
                  className="h-6 w-6 rounded-full ring-1 ring-black/20"
                  style={{
                    backgroundColor: {
                      yellow: "#FFEB3B",
                      pink: "#F48FB1",
                      blue: "#81D4FA",
                      green: "#A5D6A7",
                    }[c],
                  }}
                />
              ))}
              <Button size="sm" variant="ghost" onClick={() => setSelected("")}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div
        className="sticky bottom-0 z-30 border-t backdrop-blur-md"
        style={{
          backgroundColor:
            readerTheme === "night"
              ? "rgba(18,18,28,0.9)"
              : readerTheme === "sepia"
                ? "rgba(244,236,216,0.9)"
                : "rgba(250,248,243,0.9)",
          borderColor: "rgba(128,128,128,0.15)",
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => go(page - 1)}
            disabled={page === 0}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <Slider
              value={[page]}
              min={0}
              max={Math.max(0, totalPages - 1)}
              step={1}
              onValueChange={(v) => go(v[0])}
              aria-label="Page position"
            />
            <div className="mt-1 flex justify-between text-[11px] opacity-70">
              <span>
                Page {page + 1} / {totalPages}
              </span>
              <span>{Math.round(progress)}% ·  ~{Math.max(1, Math.round((totalPages - page) * 0.6))} min left</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => go(page + 1)}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
