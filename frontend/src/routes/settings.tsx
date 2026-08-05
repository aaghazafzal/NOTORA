import { createFileRoute } from "@tanstack/react-router";
import { THEMES } from "@/lib/themes";
import { useAppStore } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { userById } from "@/data/users";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Notora" },
      { name: "description", content: "Account, appearance, and notification preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const user = userById(useAppStore((s) => s.currentUserId));
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState("maya@notora.app");
  const [language, setLanguage] = useState("English");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="font-display text-3xl font-black sm:text-4xl">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tune the app to fit how you read.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a palette. All themes meet WCAG AA contrast.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                theme === t.id
                  ? "border-primary bg-accent/40"
                  : "border-border hover:bg-accent/20"
              }`}
            >
              <div className="flex h-10 w-20 overflow-hidden rounded-lg ring-1 ring-border">
                {t.swatch.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex-1">
                <div className="font-display font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {t.mode}
                </div>
              </div>
              {theme === t.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Account</h2>
        <div className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              maxLength={80}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="lang">Language</Label>
            <select
              id="lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
              <option>French</option>
              <option>Japanese</option>
            </select>
          </div>
          <Button
            onClick={() => toast.success("Settings saved")}
            className="rounded-full"
          >
            Save changes
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Notifications</h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {[
            { label: "New reviews on my books", def: true },
            { label: "Someone follows me", def: true },
            { label: "Replies to my comments", def: true },
            { label: "Weekly digest email", def: false },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between p-4">
              <span className="text-sm">{row.label}</span>
              <Switch defaultChecked={row.def} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Security</h2>
        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Two-factor authentication</div>
              <div className="text-xs text-muted-foreground">
                Extra step at sign-in.
              </div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Session sync across devices</div>
              <div className="text-xs text-muted-foreground">
                Continue reading anywhere.
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </section>
    </div>
  );
}
