// Deterministic gradient cover generator based on title.
const PALETTES = [
  ["#D500F9", "#7C4DFF"],
  ["#2979FF", "#00E5FF"],
  ["#FF4081", "#7C4DFF"],
  ["#26A69A", "#64FFDA"],
  ["#FFCA28", "#FF6D00"],
  ["#7C4DFF", "#2196F3"],
  ["#F50057", "#FF9100"],
  ["#00BFA5", "#1DE9B6"],
  ["#651FFF", "#00B0FF"],
  ["#FF3D00", "#FFC400"],
  ["#3D5AFE", "#00E676"],
  ["#AA00FF", "#FF80AB"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function coverGradient(seed: string): { from: string; to: string; angle: number } {
  const h = hash(seed);
  const [from, to] = PALETTES[h % PALETTES.length];
  const angle = (h % 12) * 15 + 135;
  return { from, to, angle };
}

export function coverStyle(seed: string): React.CSSProperties {
  const { from, to, angle } = coverGradient(seed);
  return {
    background: `linear-gradient(${angle}deg, ${from}, ${to})`,
  };
}
