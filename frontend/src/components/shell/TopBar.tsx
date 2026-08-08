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

function NotificationItem({ notif, t, onDismiss }: any) {
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
      onDismiss(notif.notifId);
    } else {
      setTranslateX(0);
    }
    setStartX(0);
  };

  const isBook = notif.type === "BOOK";

  return (
    <li
      className="relative rounded-lg border border-border p-0 bg-accent/30 hover:bg-accent/50 transition-all overflow-hidden group touch-pan-y"
      style={{ transform: `translateX(${translateX}px)`, opacity: translateX > 80 ? 0 : 1 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Link 
        to={isBook ? "/book/$bookId" : "/profile/$userId"} 
        params={isBook ? { bookId: notif._id } : { userId: notif.followerId }} 
        className="block p-3"
      >
        <div className="flex justify-between items-start gap-2">
          {isBook ? (
            <div className="text-sm font-semibold text-primary">{t("New book uploaded!")}</div>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={notif.followerPhoto || undefined} className="object-cover" />
                <AvatarFallback className="text-[10px]">{notif.followerName?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-semibold text-primary">{t("New follower!")}</div>
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDismiss(notif.notifId);
            }}
            className="hidden sm:flex h-6 w-6 items-center justify-center rounded-full hover:bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {isBook ? (
          <>
            <div className="mt-1 text-sm text-foreground font-medium pr-6">{notif.title}</div>
            <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{t("by")} {notif.author}</div>
          </>
        ) : (
          <div className="mt-2 text-sm text-foreground font-medium pr-6">
            <span className="font-semibold">{notif.followerName}</span> {t("started following you")}
          </div>
        )}
        <div className="mt-2 text-[10px] text-muted-foreground">
          {new Date(notif.notifDate).toLocaleDateString()}
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

  useEffect(() => {
    if (user && user.uid && user.displayName) {
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/users/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          name: user.displayName,
          photoUrl: user.photoURL,
        })
      }).catch(() => {});
    }
  }, [user]);

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

  const { data: newFollowers } = useQuery({
    queryKey: ["notifications", "new-followers"],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/users/${user.uid}/recent-followers`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const allNotifs = (() => {
    const books = (newBooks || []).map((b: any) => ({
      ...b,
      type: "BOOK",
      notifId: `book-${b._id}`,
      notifDate: new Date(b.uploadDate).getTime()
    }));
    
    const followers = (newFollowers || []).map((f: any) => ({
      ...f,
      type: "FOLLOWER",
      notifId: `follow-${f._id}`,
      notifDate: new Date(f.createdAt).getTime()
    }));
    
    return [...books, ...followers].sort((a, b) => b.notifDate - a.notifDate);
  })();

  const activeNotifs = allNotifs.filter((n: any) => !dismissedNotifs.includes(n.notifId));

  const unreadCount = activeNotifs.filter((n: any) => n.notifDate > lastSeenTime).length;

  const handleDismiss = (id: string) => {
    const next = [...dismissedNotifs, id];
    setDismissedNotifs(next);
    localStorage.setItem("notora-dismissed-notifs", JSON.stringify(next));
  };

  const handleOpenNotifs = (open: boolean) => {
    if (open && activeNotifs.length > 0) {
      const latest = activeNotifs[0].notifDate;
      if (latest > lastSeenTime) {
        setLastSeenTime(latest);
        localStorage.setItem("notora-last-seen-notif", latest.toString());
      }
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
              <div className="mt-4">
                {activeNotifs.length > 0 ? (
                  <ul className="flex flex-col gap-2 p-1">
                    {activeNotifs.map((notif: any) => (
                      <NotificationItem 
                        key={notif.notifId} 
                        notif={notif} 
                        t={t} 
                        onDismiss={handleDismiss} 
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">{t("No new notifications")}</div>
                )}
              </div>
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
