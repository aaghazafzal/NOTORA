import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, BookMarked, Heart, CheckCircle2, Clock, Loader2, LogIn, Bookmark, Library } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — Notora" },
      {
        name: "description",
        content: "Your shelves: reading, favorites, completed, to-read, and custom lists.",
      },
    ],
  }),
  component: LibraryPage,
});

const SHELVES = [
  { id: "reading", labelKey: "Currently Reading", icon: BookMarked },
  { id: "favorites", labelKey: "Favorites", icon: Heart },
  { id: "completed", labelKey: "Completed", icon: CheckCircle2 },
  { id: "to-read", labelKey: "To Read", icon: Clock },
];

function ShelfGrid({ books }: { books: any[] }) {
  const { t } = useTranslation();
  if (!books || books.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl p-12 sm:p-16 text-center max-w-2xl mx-auto mt-6 shadow-[0_0_40px_-15px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-6 shadow-inner">
          <Library className="h-10 w-10 text-muted-foreground/70" />
        </div>
        <p className="relative z-10 font-display text-2xl font-semibold text-foreground">{t("This shelf is empty")}</p>
        <p className="relative z-10 mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
          {t("Browse the library and add books to fill it up with your favorites.")}
        </p>
        <Button
          className="relative z-10 mt-8 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 backdrop-blur-md transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]"
          onClick={() => (window.location.href = "/browse")}
        >
          {t("Browse Library")}
        </Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 mt-6">
      {books.map((b) => (
        <div key={b._id} className="flex justify-center">
          <BookCard
            book={{
              id: b._id,
              slug: b.slug || b._id,
              title: b.title,
              authorName: b.author,
              coverUrl: b.coverUrl,
              genre: b.genre || "Other",
              tags: b.tags || [],
              rating: 4.8,
              ratingCount: 152,
              language: b.language || "English",
              pages: b.pages || 0,
              publishedYear: b.publishedYear || null,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function LibraryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(auth.currentUser);
  const [authResolved, setAuthResolved] = useState(false);
  const [newShelf, setNewShelf] = useState("");
  const [open, setOpen] = useState(false);
  const [activeShelf, setActiveShelf] = useState("reading");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthResolved(true);
    });
  }, []);

  const { data: library, isLoading } = useQuery({
    queryKey: ["library", user?.uid],
    queryFn: async () => {
      const token = await user!.getIdToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/library`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch library");
      return res.json();
    },
    enabled: !!user,
  });

  if (!authResolved || isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center px-4">
        <div className="mb-6 rounded-full bg-primary/10 p-6 shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)]">
          <LogIn className="h-12 w-12 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {t("Sign in to view your library")}
        </h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          {t("Keep track of your reading progress, organize your favorite books, and manage your shelves across all devices.")}
        </p>
        <Button
          className="mt-8 rounded-full px-8 shadow-lg shadow-primary/20"
          onClick={() => (window.location.href = "/login")}
        >
          {t("Sign In")}
        </Button>
      </div>
    );
  }

  // Combine shelves from backend
  const reading = library?.shelves?.reading || [];
  const favorites = library?.shelves?.favorites || [];
  const completed = library?.shelves?.completed || [];
  const toRead = library?.shelves?.["to-read"] || [];

  const customShelves = library?.customShelves || {};
  const continueReading = reading.filter((b: any) => library?.progress?.[b._id]);

  const allShelves = [
    ...SHELVES,
    ...Object.keys(customShelves).map((name) => ({
      id: name,
      label: name,
      icon: Bookmark,
      isCustom: true,
    })),
  ];

  const getBooksForShelf = (shelfId: string) => {
    switch (shelfId) {
      case "reading":
        return reading;
      case "favorites":
        return favorites;
      case "completed":
        return completed;
      case "to-read":
        return toRead;
      default:
        return customShelves[shelfId] || [];
    }
  };

  const activeBooks = getBooksForShelf(activeShelf);
  const activeShelfLabel = allShelves.find((s) => s.id === activeShelf)?.label || activeShelf;

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 md:px-8 xl:px-12 sm:py-10 min-h-[80vh]">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6 relative">
        <div className="absolute top-0 right-0 -z-10 h-32 w-32 bg-primary/20 blur-[100px] rounded-full opacity-50" />
        <div>
          <h1 className="font-display text-4xl font-black sm:text-5xl tracking-tight text-foreground drop-shadow-sm">
            {t("My Library")}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {t("Organize what you're reading and what's next.")}
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-6 md:sticky md:top-24 md:h-[calc(100vh-150px)]">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("Your Shelves")}
            </h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary transition-colors focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl border-white/10 bg-zinc-950/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-display">{t("Create a new shelf")}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    autoFocus
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    placeholder={t("e.g. Summer reads, Book club, Sci-Fi...")}
                    maxLength={40}
                    className="h-12 text-lg rounded-xl border-white/10 bg-black/40 focus-visible:ring-primary/50 placeholder:text-muted-foreground/50"
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" className="rounded-full hover:bg-white/5" onClick={() => setOpen(false)}>
                    {t("Cancel")}
                  </Button>
                  <Button
                    className="rounded-full shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
                    onClick={async () => {
                      if (newShelf.trim()) {
                        const token = await user!.getIdToken();
                        await fetch(
                          `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/library/shelves`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              targetShelf: newShelf.trim(),
                              custom: true,
                              action: "create",
                            }),
                          },
                        );
                        queryClient.invalidateQueries({ queryKey: ["library"] });
                        setNewShelf("");
                        setOpen(false);
                      }
                    }}
                  >
                    Create Shelf
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Shelves Navigation */}
          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:max-h-[calc(100vh-250px)] pb-2 md:pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">
            {allShelves.map((s) => {
              const isActive = activeShelf === s.id;
              const count = getBooksForShelf(s.id).length;

              return (
                <button
                  key={s.id}
                  onClick={() => setActiveShelf(s.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 relative whitespace-nowrap shrink-0 md:shrink md:w-full border",
                    isActive
                      ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary),0.2)]"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <s.icon className={cn("h-5 w-5", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "")} />
                  <span className="flex-1 text-left">{s.label}</span>
                  <span
                    className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded-full transition-colors ml-3",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-white/10 text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/20 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col gap-12">
          {activeShelf === "reading" && continueReading.length > 0 && (
            <section>
              <h2 className="mb-6 font-display text-2xl font-bold tracking-tight flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)] animate-pulse" />
                Continue Reading
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {continueReading.map((book: any) => (
                  <div key={book._id} className="flex flex-col items-center group">
                    <BookCard
                      book={{
                        id: book._id,
                        slug: book.slug || book._id,
                        title: book.title,
                        authorName: book.author,
                        coverUrl: book.coverUrl,
                        genre: book.genre || "Other",
                        tags: book.tags || [],
                        rating: 4.8,
                        ratingCount: 152,
                        language: book.language || "English",
                        pages: book.pages || 0,
                        publishedYear: book.publishedYear || null,
                      }}
                    />
                    {library.progress[book._id] && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20 transition-all group-hover:bg-primary/20 group-hover:shadow-[0_0_12px_rgba(var(--primary),0.3)]">
                        <BookMarked className="h-3 w-3" />
                        Page {library.progress[book._id]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tight capitalize">
                {activeShelfLabel}
              </h2>
              <span className="text-sm font-medium text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {activeBooks.length} {activeBooks.length === 1 ? "book" : "books"}
              </span>
            </div>
            
            <ShelfGrid books={activeBooks} />
          </section>
        </main>
      </div>
    </div>
  );
}
