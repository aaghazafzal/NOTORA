import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { THEMES } from "@/lib/themes";
import { useAppStore } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Loader2, LogIn, User, Palette, Bell } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Notora" },
      { name: "description", content: "Account, appearance, and notification preferences." },
    ],
  }),
  component: SettingsPage,
});

const SECTIONS = [
  { id: "account", label: "Account", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const [user, setUser] = useState<any>(auth.currentUser);
  const [authResolved, setAuthResolved] = useState(false);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState({
    newReviews: true,
    newFollowers: true,
    replies: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthResolved(true);
    });
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile", user?.uid],
    queryFn: async () => {
      const token = await user!.getIdToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/users/${user.uid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch user data");
      return res.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.displayName || "");
      if (profile.settings) {
        const lang = profile.settings.language || "English";
        setLanguage(lang);
        i18n.changeLanguage(lang === "Hindi" ? "hi" : "en");
        setNotifications({
          newReviews: profile.settings.notifications?.newReviews ?? true,
          newFollowers: profile.settings.notifications?.newFollowers ?? true,
          replies: profile.settings.notifications?.replies ?? true,
          weeklyDigest: profile.settings.notifications?.weeklyDigest ?? false,
        });
      }
    }
  }, [profile, user]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (updatedData: any) => {
      const token = await user!.getIdToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9090"}/api/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        },
      );
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.uid] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const saveAccount = () => {
    const payload = {
      name,
      settings: {
        language,
        notifications,
      },
    };
    if (name !== user?.displayName) {
      updateProfile(auth.currentUser!, { displayName: name }).catch(console.error);
    }
    mutate(payload);
  };

  const updateNotification = (key: keyof typeof notifications, val: boolean) => {
    const newNotifs = { ...notifications, [key]: val };
    setNotifications(newNotifs);
    mutate({
      name,
      settings: {
        language,
        notifications: newNotifs,
      },
    });
  };

  if (!authResolved) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center px-4">
        <div className="mb-6 rounded-full bg-primary/10 p-6 shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)]">
          <LogIn className="h-12 w-12 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Sign in to view settings
        </h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Manage your account, preferences, and notifications.
        </p>
        <Button
          className="mt-8 rounded-full px-8 shadow-lg shadow-primary/20"
          onClick={() => (window.location.href = "/login")}
        >
          Sign In
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 md:px-8 xl:px-12 sm:py-10 min-h-[80vh]">
        <div className="mb-10 flex flex-col gap-2 border-b border-white/10 pb-6">
          <Skeleton className="h-12 w-48 rounded-xl bg-white/5" />
          <Skeleton className="h-5 w-64 rounded-lg bg-white/5" />
        </div>
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          <div className="w-full md:w-64 lg:w-72 flex flex-col gap-4">
            <Skeleton className="h-12 w-full rounded-2xl bg-white/5" />
            <Skeleton className="h-12 w-full rounded-2xl bg-white/5" />
            <Skeleton className="h-12 w-full rounded-2xl bg-white/5" />
            <Skeleton className="h-12 w-full rounded-2xl bg-white/5" />
          </div>
          <div className="flex-1 flex flex-col gap-6">
            <Skeleton className="h-8 w-48 rounded-lg bg-white/5 mb-2" />
            <Skeleton className="h-[300px] w-full rounded-3xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 md:px-8 xl:px-12 sm:py-10 min-h-[80vh]">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6 relative">
        <div className="absolute top-0 right-0 -z-10 h-32 w-32 bg-primary/20 blur-[100px] rounded-full opacity-50" />
        <div>
          <h1 className="font-display text-4xl font-black sm:text-5xl tracking-tight text-foreground drop-shadow-sm">
            {t("Settings")}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            {t("Tune the app to fit how you read.")}
          </p>
        </div>
      </header>

      <div className="flex justify-center">
        <main className="w-full max-w-4xl flex flex-col gap-12">
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">{t("Account")}</h2>
              <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-xl">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-muted-foreground">{t("Display name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl border-white/10 bg-black/40 focus-visible:ring-primary/50 text-base"
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">{t("Email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="h-12 rounded-xl border-white/10 bg-black/40 opacity-50 cursor-not-allowed text-base"
                  />
                  <p className="text-xs text-muted-foreground/70">{t("Email addresses are tied to your authentication provider.")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lang" className="text-muted-foreground">{t("Language")}</Label>
                  <select
                    id="lang"
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      i18n.changeLanguage(e.target.value === "Hindi" ? "hi" : "en");
                    }}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-base focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:outline-none [&>option]:bg-zinc-900"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>
                <div className="pt-2">
                  <Button 
                    onClick={saveAccount} 
                    disabled={isPending}
                    className="rounded-full shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 px-8"
                  >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("Save changes")}
                  </Button>
                </div>
              </div>
            </section>
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="mb-2 font-display text-2xl font-bold tracking-tight">{t("Appearance")}</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                {t("Pick a palette. All themes meet WCAG AA contrast.")}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-3xl border p-4 text-left transition-all backdrop-blur-xl group",
                      theme === t.id 
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]" 
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    <div className="flex h-12 w-24 overflow-hidden rounded-xl ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                      {t.swatch.map((c, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="font-display font-semibold text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{t.mode}</div>
                    </div>
                    {theme === t.id && <Check className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />}
                  </button>
                ))}
              </div>
            </section>
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">{t("Notifications")}</h2>
              <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                {[
                  { id: "newReviews", label: "New reviews on my books", desc: "Get notified when someone reviews a book you authored." },
                  { id: "newFollowers", label: "Someone follows me", desc: "Know when your network grows." },
                  { id: "replies", label: "Replies to my comments", desc: "Stay in the loop with discussions." },
                  { id: "weeklyDigest", label: "Weekly digest email", desc: "A summary of top books and reviews in your network." },
                ].map((row) => (
                  <div key={row.id} className="flex items-center justify-between p-6">
                    <div className="space-y-1 pr-4">
                      <div className="font-medium text-foreground">{t(row.label)}</div>
                      <div className="text-sm text-muted-foreground">{t(row.desc)}</div>
                    </div>
                    <Switch 
                      checked={notifications[row.id as keyof typeof notifications]}
                      onCheckedChange={(val) => updateNotification(row.id as keyof typeof notifications, val)}
                    />
                  </div>
                ))}
              </div>
            </section>
        </main>
      </div>
    </div>
  );
}
