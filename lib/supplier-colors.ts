export const SUPPLIER_COLOR_OPTIONS = [
  { key: "slate",   bg: "#e2e8f0", text: "#334155" },
  { key: "red",     bg: "#fee2e2", text: "#b91c1c" },
  { key: "orange",  bg: "#ffedd5", text: "#c2410c" },
  { key: "amber",   bg: "#fef3c7", text: "#b45309" },
  { key: "lime",    bg: "#ecfccb", text: "#4d7c0f" },
  { key: "emerald", bg: "#d1fae5", text: "#065f46" },
  { key: "teal",    bg: "#ccfbf1", text: "#0f766e" },
  { key: "sky",     bg: "#e0f2fe", text: "#0369a1" },
  { key: "blue",    bg: "#dbeafe", text: "#1d4ed8" },
  { key: "violet",  bg: "#ede9fe", text: "#6d28d9" },
  { key: "pink",    bg: "#fce7f3", text: "#be185d" },
  { key: "rose",    bg: "#ffe4e6", text: "#be123c" },
] as const;

export type SupplierColorKey = typeof SUPPLIER_COLOR_OPTIONS[number]["key"];

export function getSupplierColor(key?: string) {
  return SUPPLIER_COLOR_OPTIONS.find((c) => c.key === key)
    ?? { bg: "#f1f5f9", text: "#475569" };
}
