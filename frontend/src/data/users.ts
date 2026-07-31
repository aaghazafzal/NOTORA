export interface User {
  id: string;
  name: string;
  handle: string;
  avatarSeed: string;
  bio: string;
  role: "reader" | "author" | "moderator" | "admin";
  followers: number;
  following: number;
  joined: string;
}

export const USERS: User[] = [
  {
    id: "u_maya",
    name: "Maya Okoye",
    handle: "@mayareads",
    avatarSeed: "maya",
    bio: "Sci-fi obsessive. Currently rereading everything by Le Guin.",
    role: "reader",
    followers: 128,
    following: 47,
    joined: "2024-03-11",
  },
  {
    id: "u_ravi",
    name: "Ravi Menon",
    handle: "@ravimenon",
    avatarSeed: "ravi",
    bio: "Author of quiet novels about noisy cities.",
    role: "author",
    followers: 2410,
    following: 32,
    joined: "2023-09-01",
  },
  {
    id: "u_juno",
    name: "Juno Park",
    handle: "@junopark",
    avatarSeed: "juno",
    bio: "Essayist. Translator. Tea drinker.",
    role: "author",
    followers: 812,
    following: 190,
    joined: "2024-01-22",
  },
  {
    id: "u_mod",
    name: "Sasha Lin",
    handle: "@sashamod",
    avatarSeed: "sasha",
    bio: "Community moderator. Books, kindness, cats.",
    role: "moderator",
    followers: 302,
    following: 88,
    joined: "2023-05-14",
  },
  {
    id: "u_admin",
    name: "Admin",
    handle: "@admin",
    avatarSeed: "admin",
    bio: "LumenPages platform admin.",
    role: "admin",
    followers: 0,
    following: 0,
    joined: "2023-01-01",
  },
];

export function userById(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}
