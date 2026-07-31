export type ThemeId =
  | "charcoal-purple"
  | "night-sky"
  | "forest-night"
  | "ocean-calm"
  | "lavender-mist"
  | "sandy-beach";

export type ThemeMode = "dark" | "light";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  mode: ThemeMode;
  swatch: string[];
}

export const THEMES: ThemeMeta[] = [
  { id: "charcoal-purple", name: "Charcoal Purple", mode: "dark", swatch: ["#1E1E2E", "#D500F9", "#7C4DFF", "#2979FF"] },
  { id: "night-sky", name: "Night Sky", mode: "dark", swatch: ["#011627", "#64FFDA", "#8892B0", "#FFEB3B"] },
  { id: "forest-night", name: "Forest Night", mode: "dark", swatch: ["#0B3D2E", "#26A69A", "#00796B", "#FFCA28"] },
  { id: "ocean-calm", name: "Ocean Calm", mode: "light", swatch: ["#F0F8F5", "#00796B", "#009688", "#B8860B"] },
  { id: "lavender-mist", name: "Lavender Mist", mode: "light", swatch: ["#F4E1FF", "#6A1B9A", "#512DA8", "#B8860B"] },
  { id: "sandy-beach", name: "Sandy Beach", mode: "light", swatch: ["#FFF9F0", "#355C7D", "#6C5B7B", "#C94C6D"] },
];

export const DEFAULT_THEME: ThemeId = "charcoal-purple";
