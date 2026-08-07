import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  BookOpen,
  Download,
  Heart,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  ArrowRight,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { coverStyle } from "@/lib/cover";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { Book } from "@/data/books";

export const Route = createFileRoute("/book/$bookId")({
  loader: async ({ params }) => {
    // Attempt backend fetch first
    let book = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/books/${params.bookId}`,
    )
      .then((r) => r.json())
      .then((b) =>
        b.error
          ? null
          : {
              id: b._id,
              slug: b._id,
              title: b.title,
              authorId: b.uploaderId || "u_real",
              authorName: b.uploaderName || b.author,
              description: b.description,
              genre: b.genre,
              tags: b.tags || [],
              language: b.language || "English",
              publishedYear: b.uploadDate ? new Date(b.uploadDate).getFullYear() : new Date().getFullYear(),
              pages: b.pages || 0,
              formats: ["pdf"],
              chapters: [{ title: "Chapter 1", paragraphs: ["This is a preview..."] }],
              coverUrl: b.coverUrl,
            },
      )
      .catch(() => null);

    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Book not found — Notora" }, { name: "robots", content: "noindex" }],
      };
    }
    const b = loaderData.book;
    const desc = b.description.slice(0, 160);
    return {
      meta: [
        { title: `${b.title} by ${b.authorName} — Notora` },
        { name: "description", content: desc },
        { property: "og:title", content: `${b.title} — Notora` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "book" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Book not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn't find that title in the library.
      </p>
      <Button asChild className="mt-6 rounded-full neon-glow">
        <Link to="/browse">Browse the library</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Something broke</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button className="mt-6 rounded-full" onClick={reset}>
        Try again
      </Button>
    </div>
  ),
  component: BookPage,
});

function SimilarBooksRow({ books, genre }: { books: Book[]; genre: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [books]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!books || books.length === 0) return null;

  return (
    <section className="mt-16 space-y-4 group/row">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary">
            <Compass className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{genre}</span>
          </div>
          <h2 className="mt-1 truncate font-display text-2xl font-bold">Similar Books</h2>
        </div>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity rounded-full shadow-lg border border-border"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          {books.map((b) => (
            <div
              key={b.id}
              className="snap-start flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]"
            >
              <BookCard book={b} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity rounded-full shadow-lg border border-border"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </section>
  );
}

function BookPage() {
  const { book } = Route.useLoaderData();

  // Fetch similar books
  const { data: similarBooks = [] } = useQuery({
    queryKey: ["similar-books", book.genre, book.id],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/books?genres=${book.genre}&limit=12`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.books
        .filter((b: any) => b._id !== book.id)
        .map((b: any) => ({
          id: b._id,
          slug: b._id,
          title: b.title,
          authorId: b.uploaderId || "u_real",
          authorName: b.uploaderName || b.author,
          description: b.description,
          genre: b.genre,
          tags: b.tags || [],
          language: b.language || "English",
          publishedYear: b.uploadDate ? new Date(b.uploadDate).getFullYear() : new Date().getFullYear(),
          pages: b.pages || 0,
          formats: ["pdf"],
          chapters: [],
          coverUrl: b.coverUrl,
        }));
    },
  });

  const favorites = useAppStore((s) => s.shelves.favorites);
  const toggleShelf = useAppStore((s) => s.toggleShelf);
  const isFav = favorites.includes(book.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 animate-in fade-in duration-500">
      
      {/* MOBILE LAYOUT (hidden on md and up) */}
      <div className="md:hidden flex flex-col gap-6">
        <div className="flex gap-5 items-start">
          <div
            className="w-32 aspect-[2/3] shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 ring-border/50 relative"
            style={(book as any).coverUrl ? { backgroundImage: `url(${(book as any).coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : coverStyle(book.id)}
          />
          <div className="flex flex-col pt-1">
            <h1 className="font-display text-2xl font-black leading-tight text-foreground line-clamp-3">
              {book.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              by{" "}
              <Link
                to="/profile/$userId"
                params={{ userId: book.authorId }}
                className="font-medium text-primary hover:underline"
              >
                {book.authorName}
              </Link>
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              {book.pages > 0 && <span>{book.pages} pages</span>}
              {book.pages > 0 && <span className="text-border">•</span>}
              <span>{book.publishedYear}</span>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="px-2 py-0.5 bg-primary/10 text-primary border-transparent text-[10px]">
                {book.genre}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="neon-glow rounded-full shadow-lg">
            <Link to="/read/$bookId" params={{ bookId: book.slug }}>
              <BookOpen className="mr-2 h-4 w-4" /> Read
            </Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-full shadow-sm hover:bg-secondary/50"
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/download/${book.id}`;
              toast.success(`${book.title} download started`);
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button
            variant={isFav ? "default" : "outline"}
            className={`rounded-full shadow-sm ${isFav ? "neon-glow bg-red-500 hover:bg-red-600 text-white" : "hover:bg-secondary/50"}`}
            onClick={() => {
              toggleShelf("favorites", book.id);
              toast.success(isFav ? "Removed from favorites" : "Added to favorites");
            }}
          >
            {isFav ? (
              <><Heart className="mr-2 h-4 w-4 fill-current" /> Favorited</>
            ) : (
              <><Heart className="mr-2 h-4 w-4" /> Favorite</>
            )}
          </Button>
          <Button
            variant="outline"
            className="rounded-full shadow-sm hover:bg-secondary/50"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
              toast.success("Link copied to clipboard");
            }}
          >
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
      </div>

      {/* DESKTOP LAYOUT (hidden on mobile) */}
      <div className="hidden md:grid gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        <div>
          <div
            className="aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border/50 relative group transition-transform duration-300 hover:scale-[1.02]"
            style={(book as any).coverUrl ? { backgroundImage: `url(${(book as any).coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : coverStyle(book.id)}
          />
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button asChild className="neon-glow rounded-full shadow-lg">
              <Link to="/read/$bookId" params={{ bookId: book.slug }}>
                <BookOpen className="mr-2 h-4 w-4" /> Read
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full shadow-sm hover:bg-secondary/50"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/download/${book.id}`;
                toast.success(`${book.title} download started`);
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button
              variant={isFav ? "default" : "outline"}
              className={`rounded-full shadow-sm ${isFav ? "neon-glow bg-red-500 hover:bg-red-600 text-white" : "hover:bg-secondary/50"}`}
              onClick={() => {
                toggleShelf("favorites", book.id);
                toast.success(isFav ? "Removed from favorites" : "Added to favorites");
              }}
            >
              {isFav ? (
                <><Heart className="mr-2 h-4 w-4 fill-current" /> Favorited</>
              ) : (
                <><Heart className="mr-2 h-4 w-4" /> Favorite</>
              )}
            </Button>
            <Button
              variant="outline"
              className="rounded-full shadow-sm hover:bg-secondary/50"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
                toast.success("Link copied to clipboard");
              }}
            >
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            by{" "}
            <Link
              to="/profile/$userId"
              params={{ userId: book.authorId }}
              className="font-medium text-primary hover:underline"
            >
              {book.authorName}
            </Link>
          </p>
          <h1 className="mt-2 font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl text-foreground">
            {book.title}
          </h1>
          
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {book.pages > 0 && <span className="text-muted-foreground font-medium">{book.pages} pages</span>}
            {book.pages > 0 && <span className="text-border">•</span>}
            <span className="text-muted-foreground font-medium">
              {book.language} · {book.publishedYear}
            </span>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-transparent">
              {book.genre}
            </Badge>
            {book.tags.map((t: string) => (
              <Badge key={t} variant="outline" className="px-3 py-1 bg-background/50">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* SHARED TABS FOR BOTH MOBILE AND DESKTOP */}
      <Tabs defaultValue="about" className="mt-10 md:mt-16 md:pl-[272px] lg:pl-[312px]">
        <TabsList className="bg-transparent border-b border-border rounded-none p-0 w-full justify-start overflow-x-auto flex-nowrap hide-scrollbar">
          <TabsTrigger 
            value="about" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground px-6 py-3 font-medium"
          >
            About
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground px-6 py-3 font-medium"
          >
            Details
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {book.description || "No description provided for this book."}
          </p>
        </TabsContent>
        
        <TabsContent value="details" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm">
            <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-muted-foreground mb-1">Published</dt>
                <dd className="font-semibold text-foreground">{book.publishedYear}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Language</dt>
                <dd className="font-semibold text-foreground">{book.language}</dd>
              </div>
              {book.pages > 0 && (
                <div>
                  <dt className="text-muted-foreground mb-1">Pages</dt>
                  <dd className="font-semibold text-foreground">{book.pages}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground mb-1">Formats</dt>
                <dd className="font-semibold text-foreground uppercase">
                  {book.formats.join(", ")}
                </dd>
              </div>
            </dl>
          </div>
        </TabsContent>
      </Tabs>

      {similarBooks.length > 0 && <SimilarBooksRow books={similarBooks} genre={book.genre} />}
    </div>
  );
}
