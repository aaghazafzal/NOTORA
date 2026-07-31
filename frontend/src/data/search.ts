import Fuse from "fuse.js";
import { BOOKS, type Book } from "./books";

const fuse = new Fuse(BOOKS, {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "authorName", weight: 0.3 },
    { name: "tags", weight: 0.1 },
    { name: "description", weight: 0.1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
});

export function searchBooks(query: string): Book[] {
  const q = query.trim();
  if (!q) return BOOKS;
  return fuse.search(q).map((r) => r.item);
}
