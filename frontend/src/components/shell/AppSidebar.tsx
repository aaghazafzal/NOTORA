import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Upload, User, Settings, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const main = [
  { to: "/", labelKey: "Home", icon: Home, exact: true },
  { to: "/browse", labelKey: "Browse", icon: Search },
  { to: "/library", labelKey: "My Library", icon: Library },
  { to: "/upload", labelKey: "Upload", icon: Upload },
];

const account = [
  { to: "/profile/me", labelKey: "Profile", icon: User },
  { to: "/settings", labelKey: "Settings", icon: Settings },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_-4px_var(--primary)]">
            <BookOpen className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Notora</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("Discover")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {main.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={isActive(it.to, it.exact)}>
                    <Link to={it.to}>
                      <it.icon className="h-5 w-5" strokeWidth={2.5} />
                      <span className="font-semibold">{t(it.labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("Account")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {account.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={isActive(it.to)}>
                    <Link to={it.to}>
                      <it.icon className="h-5 w-5" strokeWidth={2.5} />
                      <span className="font-semibold">{t(it.labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
