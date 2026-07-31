export interface ModerationItem {
  id: string;
  kind: "book" | "review" | "dmca";
  title: string;
  submittedBy: string;
  reason?: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

export const MODERATION_QUEUE: ModerationItem[] = [
  {
    id: "m1",
    kind: "book",
    title: "Unfinished Symphonies",
    submittedBy: "anon_uploader",
    submittedAt: "1 hour ago",
    status: "pending",
  },
  {
    id: "m2",
    kind: "review",
    title: "Review flagged as spam on 'The Iron Choir'",
    submittedBy: "@newuser201",
    reason: "Contains promotional links",
    submittedAt: "4 hours ago",
    status: "pending",
  },
  {
    id: "m3",
    kind: "dmca",
    title: "DMCA takedown: 'Paper Lanterns'",
    submittedBy: "Rights Holder LLC",
    reason: "Claims unauthorized distribution of chapters 3-5",
    submittedAt: "Yesterday",
    status: "pending",
  },
  {
    id: "m4",
    kind: "book",
    title: "Small Machines, Warm Rooms",
    submittedBy: "@junopark",
    submittedAt: "2 days ago",
    status: "approved",
  },
  {
    id: "m5",
    kind: "review",
    title: "Review flagged as harassment on 'Slow Fire'",
    submittedBy: "@userxyz",
    reason: "Personal attack",
    submittedAt: "3 days ago",
    status: "rejected",
  },
];
