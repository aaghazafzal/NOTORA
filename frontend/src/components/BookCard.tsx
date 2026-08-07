import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Book } from "@/data/books";
import { coverStyle } from "@/lib/cover";

interface Props {
  book: Book;
  size?: "sm" | "md" | "lg";
}

export function BookCard({ book, size = "md" }: Props) {
  const widths = {
    sm: "w-28",
    md: "w-36 sm:w-40",
    lg: "w-48 sm:w-56",
  } as const;

  return (
    <Link
      to="/book/$bookId"
      params={{ bookId: book.slug }}
      className={`group block shrink-0 ${widths[size]}`}
    >
      <div
        className="relative aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-border transition-all duration-300 group-hover:shadow-xl group-hover:ring-primary/50 group-hover:brightness-[1.02]"
        style={
          book.coverUrl
            ? {
                backgroundImage: `url(${book.coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : coverStyle(book.id)
        }
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-background/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-3 z-10">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
            {book.genre}
          </div>
          <div>
            <div className="font-display text-sm font-bold leading-tight text-foreground line-clamp-3">
              {book.title}
            </div>
            <div className="mt-1 text-[11px] text-foreground/80">{book.authorName}</div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="h-3 w-3 fill-current text-accent" aria-hidden />
        <span className="font-medium text-foreground">{book.rating.toFixed(1)}</span>
        <span>·</span>
        <span>{book.ratingCount.toLocaleString()}</span>
      </div>
    </Link>
  );
}
