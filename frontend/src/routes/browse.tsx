import { useMemo, useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ChevronDown, X, Loader2, Clock, Trophy, Crown, Medal } from "lucide-react";
import { z } from "zod";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ALL_GENRES, ALL_LANGUAGES, ALL_TAGS } from "@/data/books";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { coverStyle } from "@/lib/cover";
import { useTranslation } from "react-i18next";

const searchSchema = z.object({
  q: z.string().optional(),
});

export const Route = createFileRoute("/browse")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Browse the library — Notora" },
      {
        name: "description",
        content: "Search and filter thousands of e-books by genre, language, tag, or rating.",
      },
    ],
  }),
  component: BrowsePage,
});

const fetchBooks = async ({ pageParam = 1, queryKey }: any) => {
  const [_key, q, genres, langs, tags] = queryKey;
  const url = new URL(`${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/books`);

  if (q) url.searchParams.append("q", q);
  if (genres.length) url.searchParams.append("genres", genres.join(","));
  if (langs.length) url.searchParams.append("langs", langs.join(","));
  if (tags.length) url.searchParams.append("tags", tags.join(","));

  url.searchParams.append("page", pageParam);
  url.searchParams.append("limit", "20");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch books");
  return res.json();
};

const SkeletonBookCard = () => (
  <div className="w-full shrink-0">
    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted/60 animate-pulse"></div>
    <div className="mt-2 space-y-2">
      <div className="h-3 w-1/3 rounded bg-muted/60 animate-pulse"></div>
      <div className="h-4 w-3/4 rounded bg-muted/60 animate-pulse"></div>
    </div>
  </div>
);

function FilterPopover({ title, activeCount, children }: any) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 sm:h-10 rounded-xl border-border bg-card hover:bg-accent/50 transition-colors"
        >
          <span className="font-medium text-xs sm:text-sm">{title}</span>
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 rounded-md px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary hover:bg-primary/30"
            >
              {activeCount}
            </Badge>
          )}
          <ChevronDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 rounded-2xl border-border shadow-xl" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function BrowsePage() {
  const { t } = useTranslation();
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState(q ?? "");
  const [genres, setGenres] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("notora-recent-searches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["books", query, genres, langs, tags], // live query
    queryFn: fetchBooks,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const results = useMemo(() => {
    if (!data) return [];

    let list = data.pages.flatMap((page) =>
      page.books.map((b: any) => ({
        id: b._id,
        slug: b._id,
        title: b.title,
        authorName: b.author,
        coverUrl: b.coverUrl,
        genre: b.genre || "Other",
        tags: b.tags || [],
        rating: 4.8,
        ratingCount: Math.floor(Math.random() * 500) + 50,
        language: b.language || "English",
        description: b.description,
      })),
    );

    if (minRating > 0) list = list.filter((b: any) => b.rating >= minRating);
    return list;
  }, [data, minRating]);

  const activeCount = genres.length + langs.length + tags.length + (minRating > 0 ? 1 : 0);
  const isSearchActive = query.trim().length > 0 || activeCount > 0;

  const clearAll = () => {
    setGenres([]);
    setLangs([]);
    setTags([]);
    setMinRating(0);
    setQuery("");
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = query.trim();
    if (term) {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== term);
        const next = [term, ...filtered].slice(0, 20);
        localStorage.setItem("notora-recent-searches", JSON.stringify(next));
        return next;
      });
      navigate({ search: { q: term } });
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== term);
      const next = [term, ...filtered].slice(0, 20);
      localStorage.setItem("notora-recent-searches", JSON.stringify(next));
      return next;
    });
    navigate({ search: { q: term } });
  };

  // Mock Top 3 using the first 3 items from the unfiltered dataset
  const top3 =
    data?.pages[0]?.books?.slice(0, 3).map((b: any) => ({
      id: b._id,
      slug: b._id,
      title: b.title,
      authorName: b.author,
      coverUrl: b.coverUrl,
      genre: b.genre || "Other",
    })) || [];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 md:px-8 sm:py-8 space-y-6">
      {/* Top Search & Filter Container */}
      <div className="bg-card/30 rounded-3xl border border-border/50 p-4 sm:p-6 shadow-sm space-y-4 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <Search
            className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search titles, authors, tags…")}
            className="pl-14 h-14 text-lg rounded-full bg-background border-border shadow-sm focus-visible:ring-primary/50 transition-all w-full"
            aria-label="Search"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap pt-2">
          <FilterPopover title={t("Language")} activeCount={langs.length}>
            <ul className="space-y-2">
              {ALL_LANGUAGES.map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <Checkbox
                    id={`l-${l}`}
                    checked={langs.includes(l)}
                    onCheckedChange={() => setLangs((s) => toggle(s, l))}
                  />
                  <label
                    htmlFor={`l-${l}`}
                    className="text-sm cursor-pointer hover:text-primary transition-colors flex-1"
                  >
                    {t(l)}
                  </label>
                </li>
              ))}
            </ul>
          </FilterPopover>

          <FilterPopover title={t("Genre")} activeCount={genres.length}>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {ALL_GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenres((s) => toggle(s, g))}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    genres.includes(g)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {t(g)}
                </button>
              ))}
            </div>
          </FilterPopover>

          <FilterPopover title={t("Rating")} activeCount={minRating > 0 ? 1 : 0}>
            <div className="flex flex-col gap-2">
              {[0, 3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left ${
                    minRating === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {r === 0 ? t("Any Rating") : `${r} ${t("Stars & Up")}`}
                </button>
              ))}
            </div>
          </FilterPopover>

          <FilterPopover title={t("Tags")} activeCount={tags.length}>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTags((s) => toggle(s, tag))}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    tags.includes(tag)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {t(tag)}
                </button>
              ))}
            </div>
          </FilterPopover>

          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground h-9 sm:h-10 px-3 rounded-xl"
            >
              {t("Clear filters")}
            </Button>
          )}
        </div>
      </div>

      {/* Conditional Content View */}
      {!isSearchActive ? (
        <div className="space-y-10 pt-4 animate-in fade-in duration-500">
          {/* Top 3 Most Searched */}
          {top3.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold font-display">{t("Top Searched Books")}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {top3.map((book: any, i: number) => (
                  <Link
                    key={book.id}
                    to="/book/$bookId"
                    params={{ bookId: book.slug }}
                    className="group relative flex items-center gap-4 bg-card hover:bg-accent border border-border p-3 rounded-2xl transition-all hover:scale-[1.02]"
                  >
                    {/* Rank Badge */}
                    <div
                      className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-xl z-10 
                      ${
                        i === 0
                          ? "bg-amber-400 text-amber-950"
                          : i === 1
                            ? "bg-slate-300 text-slate-900"
                            : "bg-orange-300 text-orange-950"
                      }`}
                    >
                      {i + 1}
                    </div>

                    <div
                      className="relative isolate aspect-[2/3] w-16 sm:w-20 rounded-lg overflow-hidden shadow-md shrink-0"
                      style={coverStyle(book)}
                    >
                      {book.coverUrl && (
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold font-display text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{book.authorName}</p>
                      <p className="text-[10px] uppercase font-semibold text-primary/70 tracking-wider mt-1">
                        {t(book.genre)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold font-display">{t("Recent Searches")}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem("notora-recent-searches");
                  }}
                  className="text-xs text-muted-foreground"
                >
                  {t("Clear All")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleRecentClick(term)}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <Search className="w-3 h-3 text-muted-foreground" />
                    {term}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* Active Search Results Grid */
        <div className="space-y-6 pt-2 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-muted-foreground">
              {isLoading
                ? t("Searching...")
                : `${data?.pages?.[0]?.totalCount ?? results.length} ${t("results found")}`}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}

            {isLoading && Array.from({ length: 12 }).map((_, i) => <SkeletonBookCard key={i} />)}
          </div>

          <div ref={observerTarget} className="flex h-20 items-center justify-center">
            {isFetchingNextPage ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : hasNextPage ? (
              <span className="text-sm text-muted-foreground">{t("Scroll for more")}</span>
            ) : results.length > 0 ? (
              <span className="text-sm text-muted-foreground">{t("You've reached the end")}</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
