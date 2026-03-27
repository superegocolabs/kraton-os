// Shared brand theme definitions used across profile settings and client portal
export const BRAND_THEMES = [
  {
    name: "Gold Sand",
    description: "Warm luxury, classic studio",
    primary: "#C5A47E",
    colors: ["#C5A47E", "#D4B896", "#8B7355"],
    portal: { bg: "#0A0A0A", card: "#171717", border: "#262626", text: "#ffffff", muted: "#888888" },
  },
  {
    name: "Pastel Rose",
    description: "Soft, elegant & feminine",
    primary: "#E8A0BF",
    colors: ["#E8A0BF", "#F5C6D0", "#BA7BA1"],
    portal: { bg: "#0E0A0C", card: "#1A1216", border: "#2E2228", text: "#FFF0F5", muted: "#9E8A90" },
  },
  {
    name: "Ocean Breeze",
    description: "Cool, calm & professional",
    primary: "#5B9BD5",
    colors: ["#5B9BD5", "#7EC8E3", "#3A7CA5"],
    portal: { bg: "#080C10", card: "#111820", border: "#1E2A36", text: "#E8F0F8", muted: "#7A8EA0" },
  },
  {
    name: "Mint Fresh",
    description: "Clean & modern feel",
    primary: "#6BCFA7",
    colors: ["#6BCFA7", "#A8E6CF", "#45B08C"],
    portal: { bg: "#080E0B", card: "#111A15", border: "#1E2E24", text: "#E8F8F0", muted: "#7AA090" },
  },
  {
    name: "Lavender Dream",
    description: "Creative & artistic",
    primary: "#9B8EC4",
    colors: ["#9B8EC4", "#C4B7E0", "#7B6FA0"],
    portal: { bg: "#0A0810", card: "#15121C", border: "#261E36", text: "#F0E8F8", muted: "#8A7EA0" },
  },
  {
    name: "Sunset Coral",
    description: "Warm, energetic & bold",
    primary: "#F4845F",
    colors: ["#F4845F", "#F7B27A", "#D96B4E"],
    portal: { bg: "#100A08", card: "#1C1410", border: "#2E2018", text: "#F8F0E8", muted: "#A08A7A" },
  },
  {
    name: "Slate Pro",
    description: "Minimal & corporate",
    primary: "#64748B",
    colors: ["#64748B", "#94A3B8", "#475569"],
    portal: { bg: "#0A0A0C", card: "#141418", border: "#222228", text: "#E8E8F0", muted: "#888890" },
  },
  {
    name: "Electric Indigo",
    description: "Modern tech & digital",
    primary: "#6366F1",
    colors: ["#6366F1", "#818CF8", "#4F46E5"],
    portal: { bg: "#08081A", card: "#10102A", border: "#1E1E3A", text: "#E8E8FF", muted: "#7A7AA0" },
  },
];

export function getThemeByColor(color: string) {
  return BRAND_THEMES.find(t => t.primary === color) ?? BRAND_THEMES[0];
}
