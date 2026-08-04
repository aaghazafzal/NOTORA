import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, TrendingUp, Compass, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Book } from "@/data/books";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { coverStyle } from "@/lib/cover";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LumenPages — Read anywhere, remember everything" },
      {
        name: "description",
        content:
          "Discover thousands of e-books, read in your browser with a reader built for long attention, and share what you love with a community of readers.",
      },
      { property: "og:title", content: "LumenPages" },
      {
        property: "og:description",
        content:
          "A modern e-book platform for readers, authors, and communities.",
      },
    ],
  }),
  component: HomePage,
});

function RowSkeleton() {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]">
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-3/4 rounded-md" />
            <Skeleton className="mt-2 h-3 w-1/2 rounded-md" />
          </div>
        ))}
      </div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <section className="grain-overlay relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted p-6 sm:p-10">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0 space-y-4">
          <Skeleton className="h-12 md:h-16 w-3/4 rounded-xl" />
          <Skeleton className="h-5 w-1/2 rounded-lg" />
          <div className="space-y-2 mt-4">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-4/6 rounded-md" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Skeleton className="h-12 w-36 rounded-full" />
            <Skeleton className="h-12 w-36 rounded-full" />
          </div>
        </div>
        <div className="hidden md:block">
          <Skeleton className="h-[320px] w-[220px] rounded-lg shadow-2xl" />
        </div>
      </div>
    </section>
  );
}

function Row({
  title,
  books,
}: {
  title: string;
  books: Book[];
}) {
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
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [books]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8; 
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!books || books.length === 0) return null;
  return (
    <section className="space-y-2 group/row relative">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate font-display text-2xl font-bold">
            {title}
          </h2>
        </div>
        <Link
          to="/browse"
          className="hidden shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:flex"
        >
          See all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="relative">
        {canScrollLeft && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity rounded-full shadow-lg border border-border"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 sm:mx-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          <div className="w-2 shrink-0 sm:hidden" aria-hidden="true" />
          {books.map((b) => (
            <div key={b.id} className="snap-start flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px]">
              <BookCard book={b} />
            </div>
          ))}
          <div className="w-2 shrink-0 sm:hidden" aria-hidden="true" />
        </div>

        {canScrollRight && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity rounded-full shadow-lg border border-border"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </section>
  );
}

function HomePage() {
  const { data: realBooks = [], isLoading } = useQuery({
    queryKey: ['home-books'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9090'}/api/books`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const booksArray = data.books || [];
      const mapped: Book[] = booksArray.map((b: any) => ({
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
        publishedYear: b.uploadDate ? new Date(b.uploadDate).getFullYear() : 2024,
        pages: 300,
        rating: 4.8,
        ratingCount: 1500,
        downloads: 120,
        formats: ["pdf"],
        chapters: [],
        coverUrl: b.coverUrl,
      }));
      // Sort by latest added first
      return mapped; // The backend already sorts by uploadDate: -1
    }
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-4 md:space-y-6 px-6 py-4 sm:px-6 md:px-8 xl:px-12 sm:py-8">
        <HeroSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  const hero = realBooks.length > 0 ? realBooks[0] : null;
  const trending = [...realBooks].slice(0, 10);
  const newReleases = [...realBooks].slice(0, 10);
  
  const allGenres = Array.from(new Set(realBooks.map((b) => b.genre))).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 md:space-y-8 px-6 py-4 sm:px-6 md:px-8 xl:px-12 sm:py-8">
      {/* Hero */}
      {hero && (
        <section className="grain-overlay relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted p-6 sm:p-10">
          <div className="grid grid-cols-[1fr_auto] gap-4 md:gap-8 items-center">
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base lg:text-lg">
                by {hero.authorName} · {hero.pages} pages · {hero.genre}
              </p>
              <p className="mt-4 max-w-2xl text-sm text-foreground/85 sm:text-base lg:text-lg line-clamp-3">
                {hero.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="neon-glow rounded-full">
                  <Link to="/read/$bookId" params={{ bookId: hero.slug }}>
                    Start reading
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="rounded-full px-0 w-12 sm:w-auto sm:px-8"
                >
                  <Link to="/book/$bookId" params={{ bookId: hero.slug }} className="flex items-center justify-center">
                    <span className="hidden sm:inline">About book</span>
                    <Info className="h-5 w-5 sm:hidden" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="block shrink-0">
              <Link to="/book/$bookId" params={{ bookId: hero.slug }}>
                <div
                  className="group relative isolate aspect-[2/3] w-24 sm:w-32 md:w-48 overflow-hidden rounded-lg bg-muted shadow-xl md:shadow-2xl transition-transform hover:scale-105"
                  style={coverStyle(hero)}
                >
                  {hero.coverUrl ? (
                    <img
                      src={hero.coverUrl}
                      alt={hero.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Rows */}
      {trending.length > 0 && (
        <Row
          title="Trending Now"
          books={trending}
        />
      )}

      {newReleases.length > 0 && (
        <Row
          title="New Arrivals"
          books={newReleases}
        />
      )}

      {/* Dynamic Genre Rows */}
      {allGenres.map((genre) => {
        const booksInGenre = realBooks.filter((b) => b.genre === genre);
        if (booksInGenre.length === 0) return null;
        
        return (
          <Row
            key={genre}
            title={genre}
            books={booksInGenre}
          />
        );
      })}

      {/* Genres Grid */}
      <section className="space-y-4 pt-8">
        <div className="flex items-center gap-2 text-primary">
          <Compass className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Explore
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold">Browse by genre</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {allGenres.map((g) => (
            <Link
              key={`grid-${g}`}
              to="/browse"
              search={{ genres: [g] }}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <span className="font-display font-medium group-hover:text-primary">
                {g}
              </span>
              <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
