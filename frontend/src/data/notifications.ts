export interface Notification {
  id: string;
  type: "review" | "follow" | "reply" | "update" | "badge";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "review",
    title: "New review on Glass Cities",
    body: "Juno Park left a 4-star review on a book you follow.",
    createdAt: "2 hours ago",
    read: false,
  },
  {
    id: "n2",
    type: "follow",
    title: "Ravi Menon started following you",
    body: "Say hello on their profile.",
    createdAt: "Yesterday",
    read: false,
  },
  {
    id: "n3",
    type: "update",
    title: "Orbital Lullaby has a new edition",
    body: "Version 2.1 fixes typography and adds an afterword.",
    createdAt: "3 days ago",
    read: true,
  },
  {
    id: "n4",
    type: "badge",
    title: "Badge unlocked: First Review",
    body: "Thanks for adding your voice to the community.",
    createdAt: "Last week",
    read: true,
  },
];
