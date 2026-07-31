export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  upvotes: number;
}

export const REVIEWS: Review[] = [
  {
    id: "r1",
    bookId: "b_glass_cities",
    userId: "u_maya",
    userName: "Maya Okoye",
    rating: 5,
    title: "A city rebuilt sentence by sentence",
    body: "Menon writes about Bombay the way you'd write about a face you've loved for decades. Every chapter is a room you didn't know you missed.",
    createdAt: "2025-02-14",
    upvotes: 42,
  },
  {
    id: "r2",
    bookId: "b_glass_cities",
    userId: "u_juno",
    userName: "Juno Park",
    rating: 4,
    title: "Slow, but the slowness is the point",
    body: "It asks patience. It returns quiet gifts. The chapter about the tea seller is worth the whole book.",
    createdAt: "2025-02-01",
    upvotes: 18,
  },
  {
    id: "r3",
    bookId: "b_orbital_lullaby",
    userId: "u_maya",
    userName: "Maya Okoye",
    rating: 5,
    title: "Sci-fi that whispers",
    body: "No lasers. No aliens. Just gravity and grief and one very good pilot. Perfect.",
    createdAt: "2025-01-22",
    upvotes: 88,
  },
  {
    id: "r4",
    bookId: "b_neon_gardener",
    userId: "u_maya",
    userName: "Maya Okoye",
    rating: 4,
    title: "Blade Runner with better plants",
    body: "The worldbuilding is dense but never showy. The romance arc caught me completely off guard.",
    createdAt: "2025-03-04",
    upvotes: 27,
  },
  {
    id: "r5",
    bookId: "b_quiet_math",
    userId: "u_ravi",
    userName: "Ravi Menon",
    rating: 5,
    title: "Every essay is a small hand on your shoulder",
    body: "I read this in a week and now I recommend it to everyone I care about.",
    createdAt: "2024-12-30",
    upvotes: 61,
  },
];

export function reviewsForBook(bookId: string): Review[] {
  return REVIEWS.filter((r) => r.bookId === bookId);
}
