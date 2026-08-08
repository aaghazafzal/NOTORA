import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, X } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { NOTIFICATIONS } from "@/data/notifications";
import { useAuthStore } from "@/store/useAuthStore";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

function NotificationItem({ b, t, onDismiss }: any) {
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === 0) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff > 0) {
      setTranslateX(diff);
    }
  };
  const handleTouchEnd = () => {
    if (translateX > 80) {
      onDismiss(b._id);
    } else {
      setTranslateX(0);
    }
    setStartX(0);
  };

  return (
    <li
      className="relative rounded-lg border border-border p-0 bg-accent/30 hover:bg-accent/50 transition-all overflow-hidden group touch-pan-y"
      style={{ transform: `translateX(${translateX}px)`, opacity: translateX > 80 ? 0 : 1 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Link to="/book/$bookId" params={{ bookId: b._id }} className="block p-3">
        <div className="flex justify-between items-start">
          <div className="text-sm font-semibold text-primary">{t("New book uploaded!")}</div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDismiss(b._id);
            }}
            className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full hover:bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1 text-sm text-foreground font-medium pr-6">{b.title}</div>
        <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{t("by")} {b.author}</div>
        <div className="mt-2 text-[10px] text-muted-foreground">
          {new Date(b.uploadDate).toLocaleDateString()}
        </div>
      </Link>
    </li>
  );
}

export function TopBar() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  const [lastSeenTime, setLastSeenTime] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("notora-last-seen-notif") || "0", 10);
    } catch {
      return 0;
    }
  });

  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("notora-dismissed-notifs") || "[]");
    } catch {
      return [];
    }
  });

  const { data: newBooks } = useQuery({
    queryKey: ["notifications", "new-books"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/books?limit=5`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.books || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const activeNewBooks = newBooks?.filter((b: any) => !dismissedNotifs.includes(b._id)) || [];

  const unreadCount = activeNewBooks.filter((b: any) => new Date(b.uploadDate).getTime() > lastSeenTime).length;

  const handleDismiss = (id: string) => {
    const next = [...dismissedNotifs, id];
    setDismissedNotifs(next);
    localStorage.setItem("notora-dismissed-notifs", JSON.stringify(next));
  };

  const handleOpenNotifs = (open: boolean) => {
    if (open && newBooks && newBooks.length > 0) {
      const latest = Math.max(...newBooks.map((b: any) => new Date(b.uploadDate).getTime()));
      setLastSeenTime(latest);
      localStorage.setItem("notora-last-seen-notif", latest.toString());
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4">
      <SidebarTrigger className="hidden md:inline-flex" />
      <Link to="/" className="flex items-center gap-2 md:hidden" aria-label="Notora home">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary">
          <span className="font-display text-xs font-bold text-primary-foreground">L</span>
        </div>
        <span className="font-display text-base font-bold">Notora</span>
      </Link>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/browse", search: { q } });
        }}
        className="ml-2 hidden max-w-md flex-1 sm:block"
      >
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("Search books, authors, tags…")}
            className="pl-9"
            aria-label="Search"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1">
        <Link to="/browse" className="sm:hidden" aria-label="Search">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <span>
              <Search className="h-5 w-5" />
            </span>
          </Button>
        </Link>
        <ThemeToggle />
        {user && (
          <Sheet onOpenChange={handleOpenNotifs}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t("Notifications")}</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 space-y-2">
                {activeNewBooks.map((b: any) => (
                  <NotificationItem key={b._id} b={b} t={t} onDismiss={handleDismiss} />
                ))}
                {activeNewBooks.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">{t("No new notifications")}</div>
                )}
              </ul>
            </SheetContent>
          </Sheet>
        )}

        {loading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Account menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {user.displayName
                      ? user.displayName.slice(0, 1).toUpperCase()
                      : user.email?.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile/$userId" params={{ userId: "me" }}>
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/library">My Library</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setShowSignOutDialog(true);
                }}
                className="text-red-500 focus:text-red-500 cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 ml-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/auth/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="rounded-full neon-glow">
              <Link to="/auth/sign-up">Sign up</Link>
            </Button>
          </div>
        )}

        {/* Sign Out Confirmation Dialog */}
        <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out? You will need to sign in again to access your
                library and profile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
