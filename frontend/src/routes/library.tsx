import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, BookMarked, Heart, CheckCircle2, Clock, Loader2, LogIn } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — LumenPages" },
      {
        name: "description",
        content: "Your shelves: reading, favorites, completed, to-read, and custom lists.",
      },
    ],
  }),
  component: LibraryPage,
});

const SHELVES = [
  { id: "reading", label: "Currently Reading", icon: BookMarked },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "to-read", label: "To Read", icon: Clock },
];

function ShelfGrid({ books }: { books: any[] }) {
  if (!books || books.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/60 bg-muted/10 p-16 text-center max-w-2xl mx-auto mt-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <BookMarked className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="font-display text-xl font-semibold">This shelf is empty</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Browse the library and add books to fill it up.
        </p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={() => window.location.href = '/browse'}>
          Browse Library
        </Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 mt-6">
      {books.map((b) => (
        <div key={b._id} className="flex justify-center">
          <BookCard book={{
            id: b._id,
            title: b.title,
            authorName: b.author,
            coverUrl: b.coverUrl,
            genre: b.genre || "Other",
            tags: b.tags || [],
            rating: 4.8,
            ratingCount: 152,
            language: b.language || "English"
          }} />
        </div>
      ))}
    </div>
  );
}

function LibraryPage() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(auth.currentUser);
  const [authResolved, setAuthResolved] = useState(false);
  const [newShelf, setNewShelf] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthResolved(true);
    });
  }, []);

  const { data: library, isLoading } = useQuery({
    queryKey: ['library', user?.uid],
    queryFn: async () => {
      const token = await user!.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/library`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
        <div className="mb-6 rounded-full bg-primary/10 p-6">
          <LogIn className="h-12 w-12 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sign in to view your library</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Keep track of your reading progress, organize your favorite books, and manage your shelves across all devices.
        </p>
        <Button className="mt-8 rounded-full px-8" onClick={() => window.location.href = '/login'}>
          Sign In
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

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 md:px-8 xl:px-12 sm:py-10 space-y-8">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-display text-4xl font-black sm:text-5xl tracking-tight">
            My Library
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Organize what you're reading and what's next.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full shadow-md hover:shadow-lg transition-shadow">
              <Plus className="mr-2 h-4 w-4" /> New Custom Shelf
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create a new shelf</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                autoFocus
                value={newShelf}
                onChange={(e) => setNewShelf(e.target.value)}
                placeholder="e.g. Summer reads, Book club, Sci-Fi..."
                maxLength={40}
                className="h-12 text-lg rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-full"
                onClick={async () => {
                  if (newShelf.trim()) {
                    const token = await user!.getIdToken();
                    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/library/shelves`, {
                      method: "POST",
                      headers: { 
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}` 
                      },
                      body: JSON.stringify({
                        targetShelf: newShelf.trim(),
                        custom: true,
                        action: 'create'
                      })
                    });
                    queryClient.invalidateQueries({ queryKey: ['library'] });
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
      </header>

      {continueReading.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">
            Continue Reading
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {continueReading.map((book: any) => (
              <div key={book._id} className="flex flex-col items-center">
                <BookCard book={{
                  id: book._id,
                  title: book.title,
                  authorName: book.author,
                  coverUrl: book.coverUrl,
                  genre: book.genre || "Other",
                  tags: book.tags || [],
                  rating: 4.8,
                  ratingCount: 152,
                  language: book.language || "English"
                }} />
                {library.progress[book._id] && (
                  <p className="mt-2 text-xs font-medium text-primary">Page {library.progress[book._id]}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-transparent gap-2 mb-8">
          {SHELVES.map((s) => {
            const count = (s.id === 'reading' ? reading : 
                           s.id === 'favorites' ? favorites : 
                           s.id === 'completed' ? completed : 
                           s.id === 'to-read' ? toRead : []).length;
            
            return (
              <TabsTrigger 
                key={s.id} 
                value={s.id}
                className="rounded-full px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md border border-transparent data-[state=inactive]:border-border/50 data-[state=inactive]:hover:bg-accent/50 transition-all"
              >
                <s.icon className="mr-2 h-4 w-4" />
                <span className="font-medium text-sm">{s.label}</span>
                <span className="ml-2 text-xs font-bold opacity-60 bg-foreground/10 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
          
          {Object.keys(customShelves).map((shelfName) => (
            <TabsTrigger 
              key={shelfName} 
              value={shelfName}
              className="rounded-full px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md border border-transparent data-[state=inactive]:border-border/50 data-[state=inactive]:hover:bg-accent/50 transition-all"
            >
              <BookMarked className="mr-2 h-4 w-4" />
              <span className="font-medium text-sm">{shelfName}</span>
              <span className="ml-2 text-xs font-bold opacity-60 bg-foreground/10 px-1.5 py-0.5 rounded-full">
                {customShelves[shelfName].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="reading" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <ShelfGrid books={reading} />
        </TabsContent>
        <TabsContent value="favorites" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <ShelfGrid books={favorites} />
        </TabsContent>
        <TabsContent value="completed" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <ShelfGrid books={completed} />
        </TabsContent>
        <TabsContent value="to-read" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
          <ShelfGrid books={toRead} />
        </TabsContent>
        
        {Object.entries(customShelves).map(([shelfName, books]: [string, any]) => (
          <TabsContent key={shelfName} value={shelfName} className="focus-visible:outline-none focus-visible:ring-0 mt-0">
            <ShelfGrid books={books} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
