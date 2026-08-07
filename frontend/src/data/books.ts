export interface Chapter {
  title: string;
  paragraphs: string[];
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  authorId: string;
  authorName: string;
  description: string;
  genre: string;
  coverUrl?: string;
  tags: string[];
  language: string;
  isbn: string;
  publishedYear: number;
  pages: number;
  rating: number;
  ratingCount: number;
  downloads: number;
  formats: ("epub" | "pdf" | "txt")[];
  featured?: boolean;
  chapters: Chapter[];
}

const LOREM = [
  "The city breathed in the color of graphite that morning, and the trams whispered along tracks slick with rain. She walked with her collar turned up against the wind, counting the seconds between one streetlight and the next.",
  "There is a particular kind of silence that lives inside a library after closing time. It is not empty. It is dense, layered, patient — the sound of thousands of held breaths waiting to be exhaled by the first reader in the morning.",
  "He remembered the letter mostly for its weight. Three pages of thick, cream paper, and each fold as precise as a small confession. He had carried it in his coat pocket for a month before he read it, and then again for a year after.",
  "The map was wrong in the way maps are always wrong — accurate about the rivers, honest about the roads, and completely blind to the small, stubborn topographies of the people who lived there.",
  "In the observatory, the astronomer's daughter learned to count stars the way other children learned to count sheep. By the time she was ten she could name every planet by the temperature of its light.",
  "They said the machine would think. What no one had predicted was that it would also grieve, quietly, in the pauses between calculations, mourning problems it had already solved and would never solve again.",
  "The garden had gone feral in the years since her grandmother died. Ivy had climbed the sundial. Foxgloves had colonized the vegetable beds. She stood at the gate and thought: this is what love looks like when nobody is watching.",
  "Every recipe in the notebook was written twice: once in her mother's careful hand, and once, faintly, in pencil beneath, with substitutions. Butter for ghee. Sugar for jaggery. A whole country reduced to what a corner shop in Leeds would sell.",
];

function makeChapters(seed: string, count: number): Chapter[] {
  const chapters: Chapter[] = [];
  for (let i = 0; i < count; i++) {
    const paras: string[] = [];
    for (let p = 0; p < 6; p++) {
      paras.push(LOREM[(i * 3 + p + seed.length) % LOREM.length]);
    }
    chapters.push({
      title: `Chapter ${i + 1}`,
      paragraphs: paras,
    });
  }
  return chapters;
}

const RAW: Omit<Book, "chapters">[] = [
  {
    id: "b_glass_cities",
    slug: "glass-cities",
    title: "Glass Cities",
    subtitle: "A novel",
    authorId: "u_ravi",
    authorName: "Ravi Menon",
    description:
      "A translator returns to Bombay after twenty years to find the city she remembers replaced by a version she cannot read. A quiet, luminous novel about language, loss, and the architecture of memory.",
    genre: "Literary Fiction",
    tags: ["contemporary", "translation", "cities", "memory"],
    language: "English",
    isbn: "978-1-4028-9462-6",
    publishedYear: 2024,
    pages: 312,
    rating: 4.6,
    ratingCount: 1284,
    downloads: 8420,
    formats: ["epub", "pdf"],
    featured: true,
  },
  {
    id: "b_orbital_lullaby",
    slug: "orbital-lullaby",
    title: "Orbital Lullaby",
    authorId: "u_juno",
    authorName: "Juno Park",
    description:
      "Six astronauts. One long night above the Earth. A meditation on distance, gravity, and the songs we sing to keep ourselves company at the edge of the world.",
    genre: "Science Fiction",
    tags: ["space", "literary", "near-future"],
    language: "English",
    isbn: "978-0-306-40615-7",
    publishedYear: 2023,
    pages: 244,
    rating: 4.8,
    ratingCount: 2911,
    downloads: 15230,
    formats: ["epub", "pdf", "txt"],
    featured: true,
  },
  {
    id: "b_salt_road",
    slug: "the-salt-road",
    title: "The Salt Road",
    authorId: "u_ravi",
    authorName: "Ravi Menon",
    description:
      "A caravan crosses the Sahara in the year 1042. Every grain of salt carries a story, and every story carries a price.",
    genre: "Historical Fiction",
    tags: ["desert", "trade", "medieval"],
    language: "English",
    isbn: "978-3-16-148410-0",
    publishedYear: 2022,
    pages: 428,
    rating: 4.4,
    ratingCount: 743,
    downloads: 3210,
    formats: ["epub", "pdf"],
    featured: true,
  },
  {
    id: "b_quiet_math",
    slug: "the-quiet-mathematics",
    title: "The Quiet Mathematics",
    authorId: "u_juno",
    authorName: "Juno Park",
    description:
      "Essays on the small equations we solve without noticing: the arithmetic of grief, the geometry of a shared kitchen, the calculus of forgiveness.",
    genre: "Essays",
    tags: ["nonfiction", "philosophy", "everyday"],
    language: "English",
    isbn: "978-0-13-110362-7",
    publishedYear: 2024,
    pages: 198,
    rating: 4.7,
    ratingCount: 512,
    downloads: 2118,
    formats: ["epub", "pdf"],
    featured: true,
  },
  {
    id: "b_neon_gardener",
    slug: "the-neon-gardener",
    title: "The Neon Gardener",
    authorId: "u_ravi",
    authorName: "Ravi Menon",
    description:
      "In a rain-drenched neo-Tokyo, a woman who tends bioluminescent plants for the ultra-rich discovers her newest client is not quite human.",
    genre: "Science Fiction",
    tags: ["cyberpunk", "noir", "romance"],
    language: "English",
    isbn: "978-0-7432-7356-5",
    publishedYear: 2025,
    pages: 356,
    rating: 4.5,
    ratingCount: 1902,
    downloads: 6740,
    formats: ["epub", "pdf"],
  },
  {
    id: "b_paper_lanterns",
    slug: "paper-lanterns",
    title: "Paper Lanterns",
    authorId: "u_juno",
    authorName: "Juno Park",
    description:
      "A short-story collection about the ways a family invents itself, one small ritual at a time.",
    genre: "Short Stories",
    tags: ["family", "quiet", "seasons"],
    language: "English",
    isbn: "978-0-321-14653-3",
    publishedYear: 2023,
    pages: 220,
    rating: 4.3,
    ratingCount: 388,
    downloads: 1245,
    formats: ["epub", "txt"],
  },
  {
    id: "b_iron_choir",
    slug: "the-iron-choir",
    title: "The Iron Choir",
    authorId: "u_ravi",
    authorName: "Ravi Menon",
    description:
      "A political thriller set inside a decaying steel town where the church, the union, and the mayor all sing from different hymnals.",
    genre: "Thriller",
    tags: ["politics", "small-town", "suspense"],
    language: "English",
    isbn: "978-0-451-52493-5",
    publishedYear: 2022,
    pages: 402,
    rating: 4.2,
    ratingCount: 1102,
    downloads: 4432,
    formats: ["epub", "pdf"],
  },
  {
    id: "b_map_of_small_hours",
    slug: "map-of-small-hours",
    title: "Map of Small Hours",
    authorId: "u_juno",
    authorName: "Juno Park",
    description:
      "A poet walks her city between 3 and 5 AM for a year. The result is part memoir, part cartography, part love letter to insomnia.",
    genre: "Memoir",
    tags: ["walking", "city", "night"],
    language: "English",
    isbn: "978-0-14-118776-1",
    publishedYear: 2024,
    pages: 176,
    rating: 4.7,
    ratingCount: 621,
    downloads: 2903,
    formats: ["epub", "pdf"],
  },
  {
    id: "b_third_language",
    slug: "the-third-language",
    title: "The Third Language",
    authorId: "u_ravi",
    authorName: "Ravi Menon",
    description:
      "Between what we say and what we mean, there is a third language. This book is a field guide.",
    genre: "Nonfiction",
    tags: ["linguistics", "communication"],
    language: "English",
    isbn: "978-0-19-852663-6",
    publishedYear: 2021,
    pages: 288,
    rating: 4.1,
    ratingCount: 244,
    downloads: 890,
    formats: ["epub", "pdf"],
  },
  {
    id: "b_house_wind",
    slug: "the-house-that-remembered-wind",
    title: "The House That Remembered Wind",
    authorId: "u_juno",
    authorName: "Juno Park",
    description:
      "A magical realist novel about a coastal house that keeps replaying every storm it has ever survived.",
    genre: "Magical Realism",
    tags: ["coast", "memory", "family"],
    language: "English",
    isbn: "978-84-376-0494-7",
    publishedYear: 2024,
    pages: 268,
    rating: 4.6,
    ratingCount: 1440,
    downloads: 5210,
    formats: ["epub", "pdf"],
  },
  {
    id: "b_slow_fire",
    slug: "slow-fire",
    title: "Slow Fire",
    authorId: "u_ravi",
    authorName: "Ravi Menon",
    description:
      "A chef opens a restaurant in a town that does not want it. A novel about hunger of every kind.",
    genre: "Literary Fiction",
    tags: ["food", "small-town", "second-chances"],
    language: "English",
    isbn: "978-0-06-093546-7",
    publishedYear: 2023,
    pages: 340,
    rating: 4.4,
    ratingCount: 902,
    downloads: 3812,
    formats: ["epub", "pdf"],
  },
  {
    id: "b_field_static",
    slug: "field-guide-to-static",
    title: "A Field Guide to Static",
    authorId: "u_juno",
    authorName: "Juno Park",
    description:
      "A memoir told through the noises other people ignore: radios between stations, dishwashers, the hum of a fridge at 3 AM.",
    genre: "Memoir",
    tags: ["sound", "quiet", "essay"],
    language: "English",
    isbn: "978-0-7432-4722-1",
    publishedYear: 2022,
    pages: 210,
    rating: 4.5,
    ratingCount: 331,
    downloads: 1408,
    formats: ["epub", "pdf"],
  },
];

// Extend to ~30 titles by procedurally cloning with variation
const EXTRA_TITLES = [
  "Cartographers of the Small Sea",
  "Notes on a Borrowed Country",
  "The Second Winter",
  "Blue Hour Radio",
  "How to Read a Kitchen",
  "The Weight of Doors",
  "A Grammar of Gardens",
  "Late Ferries",
  "The Astronomer's Housekeeper",
  "Everything the River Kept",
  "Small Machines, Warm Rooms",
  "The Season of Repairs",
  "Postcards from a Quiet War",
  "The Language of Elevators",
  "An Atlas of Almosts",
  "Lantern, River, Bone",
  "The Museum of Ordinary Weather",
  "House With Six Rooms",
];

const EXTRA_GENRES = [
  "Poetry",
  "Fantasy",
  "Mystery",
  "Literary Fiction",
  "Nonfiction",
  "Historical Fiction",
];

const EXTRA: Omit<Book, "chapters">[] = EXTRA_TITLES.map((t, i) => {
  const slug = t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return {
    id: `b_${slug.replace(/-/g, "_").slice(0, 24)}`,
    slug,
    title: t,
    authorId: i % 2 === 0 ? "u_ravi" : "u_juno",
    authorName: i % 2 === 0 ? "Ravi Menon" : "Juno Park",
    description:
      "A crafted, quiet work that rewards slow reading and returns different answers on second visits.",
    genre: EXTRA_GENRES[i % EXTRA_GENRES.length],
    tags: ["literary", "atmospheric", "quiet"],
    language: i % 5 === 0 ? "Hindi" : i % 4 === 0 ? "Spanish" : "English",
    isbn: `978-0-000-${(10000 + i).toString().slice(1)}-0`,
    publishedYear: 2020 + (i % 6),
    pages: 180 + ((i * 37) % 260),
    rating: 3.6 + ((i * 13) % 14) / 10,
    ratingCount: 40 + ((i * 91) % 900),
    downloads: 200 + ((i * 313) % 4000),
    formats: (i % 3 === 0 ? ["epub", "pdf"] : i % 3 === 1 ? ["epub"] : ["epub", "pdf", "txt"]) as (
      "epub" | "pdf" | "txt"
    )[],
  };
});

export const BOOKS: Book[] = [...RAW, ...EXTRA].map((b) => ({
  ...b,
  chapters: makeChapters(b.id, 8),
}));

export function bookBySlug(slug: string): Book | undefined {
  return BOOKS.find((b) => b.slug === slug);
}
export function bookById(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}
export function booksByAuthor(authorId: string): Book[] {
  return BOOKS.filter((b) => b.authorId === authorId);
}

export const ALL_GENRES = Array.from(new Set(BOOKS.map((b) => b.genre))).sort();
export const ALL_LANGUAGES = Array.from(new Set(BOOKS.map((b) => b.language))).sort();
export const ALL_TAGS = Array.from(new Set(BOOKS.flatMap((b) => b.tags))).sort();
