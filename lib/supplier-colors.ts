export const SUPPLIER_COLOR_OPTIONS = [
  { key: "slate",   bg: "#475569", text: "#f8fafc" },
  { key: "red",     bg: "#b91c1c", text: "#fff1f2" },
  { key: "orange",  bg: "#c2410c", text: "#fff7ed" },
  { key: "amber",   bg: "#b45309", text: "#fffbeb" },
  { key: "lime",    bg: "#4d7c0f", text: "#f7fee7" },
  { key: "emerald", bg: "#065f46", text: "#ecfdf5" },
  { key: "teal",    bg: "#0f766e", text: "#f0fdfa" },
  { key: "sky",     bg: "#0369a1", text: "#f0f9ff" },
  { key: "blue",    bg: "#1d4ed8", text: "#eff6ff" },
  { key: "violet",  bg: "#6d28d9", text: "#f5f3ff" },
  { key: "pink",    bg: "#be185d", text: "#fdf2f8" },
  { key: "rose",    bg: "#be123c", text: "#fff1f2" },
] as const;

export type SupplierColorKey = typeof SUPPLIER_COLOR_OPTIONS[number]["key"];

export function getSupplierColor(key?: string) {
  return SUPPLIER_COLOR_OPTIONS.find((c) => c.key === key)
    ?? { bg: "#f1f5f9", text: "#475569" };
}
