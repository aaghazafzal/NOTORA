import { createFileRoute } from "@tanstack/react-router";
import { Users, BookOpen, Flag, TrendingUp, Check, X } from "lucide-react";
import { BOOKS } from "@/data/books";
import { USERS } from "@/data/users";
import { REVIEWS } from "@/data/reviews";
import { MODERATION_QUEUE } from "@/data/moderation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Notora" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [queue, setQueue] = useState(MODERATION_QUEUE);
  const stats = [
    { label: "Users", value: USERS.length + 12481, icon: Users },
    { label: "Books", value: BOOKS.length + 2140, icon: BookOpen },
    { label: "Reviews", value: REVIEWS.length + 8103, icon: TrendingUp },
    { label: "Flags open", value: queue.filter((q) => q.status === "pending").length, icon: Flag },
  ];

  const act = (id: string, status: "approved" | "rejected") => {
    setQueue((qs) => qs.map((q) => (q.id === id ? { ...q, status } : q)));
    toast.success(status === "approved" ? "Approved" : "Rejected");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="font-display text-3xl font-black sm:text-4xl">
        Admin dashboard
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Site health, moderation, and takedown notices.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <s.icon className="h-4 w-4" />
              {s.label}
            </div>
            <div className="mt-2 font-display text-3xl font-black">
              {s.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="pending" className="mt-10">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="handled">Handled</TabsTrigger>
        </TabsList>
        {(["pending", "handled"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
            {queue
              .filter((q) =>
                tab === "pending" ? q.status === "pending" : q.status !== "pending"
              )
              .map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                        <Badge variant="outline" className="capitalize">
                          {q.kind}
                        </Badge>
                        <span>{q.submittedAt}</span>
                      </div>
                      <div className="mt-2 font-display font-semibold">
                        {q.title}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        by {q.submittedBy}
                        {q.reason && ` — ${q.reason}`}
                      </div>
                    </div>
                    {q.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => act(q.id, "approved")}
                        >
                          <Check className="mr-1 h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => act(q.id, "rejected")}
                        >
                          <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        variant={q.status === "approved" ? "secondary" : "destructive"}
                        className="capitalize"
                      >
                        {q.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
