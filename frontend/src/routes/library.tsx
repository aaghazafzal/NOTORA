import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, BookMarked, Heart, CheckCircle2, Clock, Loader2, LogIn, Bookmark, Library, MoreHorizontal, Edit, Trash2, X, CheckSquare } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

function ShelfGrid({ 
  books, 
  selectionMode, 
  selectedBooks, 
  toggleSelection 
}: { 
  books: any[], 
  selectionMode?: boolean,
  selectedBooks?: string[],
  toggleSelection?: (id: string) => void 
}) {
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
        <div 
          key={b._id} 
          className={cn("flex justify-center relative", selectionMode ? "cursor-pointer group" : "")}
          onClick={() => {
            if (selectionMode && toggleSelection) {
              toggleSelection(b._id);
            }
          }}
        >
          <div className={cn("transition-all duration-200 w-full", selectionMode && selectedBooks?.includes(b._id) && "scale-95 opacity-80")}>
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
          {selectionMode && (
            <div className="absolute inset-0 z-10 flex items-start justify-end p-3 pointer-events-none">
              <div className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                selectedBooks?.includes(b._id)
                  ? "bg-primary border-primary text-primary-foreground scale-110 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                  : "bg-black/50 border-white/50 text-transparent backdrop-blur-md group-hover:border-white group-hover:bg-black/70"
              )}>
                <CheckSquare className="h-3.5 w-3.5" />
              </div>
            </div>
          )}
          {selectionMode && <div className="absolute inset-0 z-[5]" />}
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
  
  // Shelf Management State
  const [editShelfName, setEditShelfName] = useState("");
  const [shelfToEdit, setShelfToEdit] = useState<string | null>(null);
  const [shelfToDelete, setShelfToDelete] = useState<string | null>(null);
  
  // Multi-Select State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

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

  const { mutate: updateShelf, isPending: isUpdatingShelf } = useMutation({
    mutationFn: async ({ action, targetShelf, newName, bookIds }: any) => {
      const token = await user!.getIdToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/library/shelves`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            targetShelf,
            newName,
            bookIds,
            custom: !SHELVES.some((s) => s.id === targetShelf),
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to update shelf");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      setShelfToEdit(null);
      setShelfToDelete(null);
      setSelectionMode(false);
      setSelectedBooks([]);
    },
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
                <div key={s.id} className="relative group flex items-center shrink-0 md:shrink md:w-full">
                  <button
                    onClick={() => {
                      setActiveShelf(s.id);
                      setSelectionMode(false);
                      setSelectedBooks([]);
                    }}
                    className={cn(
                      "flex flex-1 items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 relative whitespace-nowrap border",
                      isActive
                        ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary),0.2)]"
                        : "bg-transparent text-muted-foreground border-transparent hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <s.icon className={cn("h-5 w-5", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "")} />
                    <span className="flex-1 text-left">{t(s.labelKey || s.label)}</span>
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
                  {s.isCustom && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full hover:bg-white/10 focus-visible:opacity-100 hidden md:flex"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl bg-zinc-950/95 backdrop-blur-xl border-white/10 p-1">
                        <DropdownMenuItem 
                          onClick={() => {
                            setShelfToEdit(s.id);
                            setEditShelfName(s.id);
                          }}
                          className="gap-2 cursor-pointer rounded-lg hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4" /> {t("Rename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setShelfToDelete(s.id)}
                          className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/20 focus:text-red-500 focus:bg-red-500/20 cursor-pointer rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" /> {t("Delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
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
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold tracking-tight capitalize">
                  {t(allShelves.find(s => s.id === activeShelf)?.labelKey || activeShelfLabel)}
                </h2>
                <span className="text-sm font-medium text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  {activeBooks.length} {activeBooks.length === 1 ? t("book") : t("books")}
                </span>
              </div>
              
              {activeBooks.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectionMode(!selectionMode);
                    if (selectionMode) setSelectedBooks([]);
                  }}
                  className={cn(
                    "rounded-full transition-all px-6",
                    selectionMode 
                      ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30" 
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  {selectionMode ? t("Cancel Selection") : t("Select Books")}
                </Button>
              )}
            </div>
            
            <ShelfGrid 
              books={activeBooks} 
              selectionMode={selectionMode}
              selectedBooks={selectedBooks}
              toggleSelection={(id) => {
                setSelectedBooks(prev => 
                  prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
                );
              }}
            />
          </section>
        </main>
      </div>

      {/* Floating Action Bar for Multi-select */}
      <div 
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out flex items-center gap-4 bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-3 pr-4 rounded-full shadow-2xl",
          selectionMode ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-3 pl-2 pr-4 border-r border-white/10">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            {selectedBooks.length}
          </div>
          <span className="text-sm font-medium">{t("Selected")}</span>
        </div>
        <Button
          variant="destructive"
          className="rounded-full shadow-lg h-9 px-6 transition-all"
          disabled={selectedBooks.length === 0 || isUpdatingShelf}
          onClick={() => {
            updateShelf({ action: 'remove_multiple', targetShelf: activeShelf, bookIds: selectedBooks });
          }}
        >
          {isUpdatingShelf ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          {t("Remove from Shelf")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelectionMode(false);
            setSelectedBooks([]);
          }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Rename Shelf Dialog */}
      <Dialog open={!!shelfToEdit} onOpenChange={(val) => !val && setShelfToEdit(null)}>
        <DialogContent className="rounded-3xl border-white/10 bg-zinc-950/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{t("Rename Shelf")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              value={editShelfName}
              onChange={(e) => setEditShelfName(e.target.value)}
              placeholder={t("Shelf name")}
              maxLength={40}
              className="h-12 text-lg rounded-xl border-white/10 bg-black/40 focus-visible:ring-primary/50"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" className="rounded-full hover:bg-white/5" onClick={() => setShelfToEdit(null)}>
              {t("Cancel")}
            </Button>
            <Button
              className="rounded-full shadow-lg shadow-primary/20"
              disabled={isUpdatingShelf || !editShelfName.trim() || editShelfName === shelfToEdit}
              onClick={() => {
                updateShelf({ action: 'rename', targetShelf: shelfToEdit, newName: editShelfName.trim() });
              }}
            >
              {isUpdatingShelf ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Shelf Dialog */}
      <Dialog open={!!shelfToDelete} onOpenChange={(val) => !val && setShelfToDelete(null)}>
        <DialogContent className="rounded-3xl border-white/10 bg-zinc-950/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-red-500">{t("Delete Shelf")}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-muted-foreground">
              {t("Are you sure you want to delete")} <span className="text-foreground font-semibold">"{shelfToDelete}"</span>?
              {t(" The books in this shelf will not be deleted from your library.")}
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" className="rounded-full hover:bg-white/5" onClick={() => setShelfToDelete(null)}>
              {t("Cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-full shadow-lg"
              disabled={isUpdatingShelf}
              onClick={() => {
                updateShelf({ action: 'delete_shelf', targetShelf: shelfToDelete });
                if (activeShelf === shelfToDelete) {
                  setActiveShelf("reading");
                }
              }}
            >
              {isUpdatingShelf ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Delete Shelf")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
