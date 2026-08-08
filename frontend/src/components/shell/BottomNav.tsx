import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Upload, User } from "lucide-react";
import { useTranslation } from "react-i18next";

const items: {
  to: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
}[] = [
  { to: "/", labelKey: "Home", icon: Home, exact: true },
  { to: "/browse", labelKey: "Browse", icon: Search },
  { to: "/library", labelKey: "Library", icon: Library },
  { to: "/upload", labelKey: "Upload", icon: Upload },
  { to: "/profile/me", labelKey: "Profile", icon: User },
];

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{t(it.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
