import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme" className="rounded-full">
          <Palette className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="mb-2 px-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Theme
        </div>
        <div className="grid gap-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`flex items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                theme === t.id ? "bg-accent/60" : ""
              }`}
            >
              <div className="flex h-6 w-14 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                {t.swatch.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex-1">
                <div className="font-medium leading-tight">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.mode === "dark" ? "Dark" : "Light"}
                </div>
              </div>
              {theme === t.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
