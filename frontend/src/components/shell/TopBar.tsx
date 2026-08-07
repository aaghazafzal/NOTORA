import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
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

export function TopBar() {
  const [q, setQ] = useState("");
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

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
            placeholder="Search books, authors, tags"
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
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 space-y-2">
                {NOTIFICATIONS.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-lg border border-border p-3 ${
                      n.read ? "opacity-60" : "bg-accent/30"
                    }`}
                  >
                    <div className="text-sm font-semibold">{n.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{n.body}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{n.createdAt}</div>
                  </li>
                ))}
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
