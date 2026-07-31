import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

/**
 * Applies the current theme by setting data-theme on <html>.
 * Read in useEffect only — SSR must not touch document.
 */
export function ThemeApplier() {
  const theme = useAppStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}
