"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Columns3, ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, Hash, ImageIcon, Tag, Ruler, Weight, Palette, FolderTree, Truck, ShoppingCart, BadgeDollarSign, Package, MapPin, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product, Category, BrandSupplier, WeightVariant, SizeEntry, WeightUnit } from "@/lib/types";
import { getSupplierColor } from "@/lib/supplier-colors";
import { toPascalCase } from "@/lib/utils";

const WEIGHT_COLORS: Record<WeightUnit, string> = {
  Dabbi:   "bg-orange-500 text-white",
  Quarter: "bg-blue-500 text-white",
  Gallon:  "bg-emerald-500 text-white",
  Bucket:  "bg-violet-500 text-white",
};

function lowestSalePrice(p: Product): number | null {
  if (p.variant_type === "weight" && p.weight_variants?.length) {
    const prices = p.weight_variants.map((v: WeightVariant) => v.sale_price ?? p.sale_price).filter((x): x is number => x != null);
    return prices.length ? Math.min(...prices) : p.sale_price ?? null;
  }
  if (p.variant_type === "size" && p.sizes?.length) {
    const prices = p.sizes.map((s: SizeEntry) => s.sale_price ?? p.sale_price).filter((x): x is number => x != null);
    return prices.length ? Math.min(...prices) : p.sale_price ?? null;
  }
  return p.sale_price ?? null;
}

function priceDisplay(p: Product): string {
  if (p.variant_type === "none" || !p.variant_type) {
    return p.sale_price != null ? `Rs ${p.sale_price.toLocaleString()}` : "—";
  }
  const low = lowestSalePrice(p);
  return low != null ? `from Rs ${low.toLocaleString()}` : "—";
}
import { Dropdown } from "./dropdown";
import ProductActions from "./product-actions";

interface ScreenerProps {
  products: Product[];
  categories: Category[];
  suppliers: BrandSupplier[];
  initialSearch?: string;
  initialCategoryId?: string;
  initialSupplierId?: string;
}

type ColKey = "no" | "image" | "name" | "sizes" | "weight" | "colors" | "category" | "supplier" | "purchasePrice" | "salePrice" | "inStock" | "shelfLocation" | "lastUpdated";

const ALL_COLS: { key: ColKey; label: string; defaultOn: boolean; align?: "right" }[] = [
  { key: "no",            label: "No.",            defaultOn: false },
  { key: "image",         label: "Image",          defaultOn: false },
  { key: "name",          label: "Name",           defaultOn: true  },
  { key: "sizes",         label: "Sizes",          defaultOn: true  },
  { key: "weight",        label: "Weight",         defaultOn: true  },
  { key: "colors",        label: "Colors",         defaultOn: false },
  { key: "category",      label: "Category",       defaultOn: false },
  { key: "supplier",      label: "Supplier",       defaultOn: false },
  { key: "purchasePrice", label: "Purchase Price", defaultOn: true,  align: "right" },
  { key: "salePrice",     label: "Sale Price",     defaultOn: true,  align: "right" },
  { key: "inStock",       label: "In Stock",       defaultOn: true,  align: "right" },
  { key: "shelfLocation", label: "Shelf Location", defaultOn: false },
  { key: "lastUpdated",   label: "Last Updated",   defaultOn: false },
];

function ColPicker({
  visible,
  onChange,
}: {
  visible: Set<ColKey>;
  onChange: (key: ColKey, on: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm bg-white transition-colors ${
          open ? "border-blue-500 ring-1 ring-blue-100 text-slate-800" : "border-slate-200 hover:border-slate-300 text-slate-500"
        }`}
      >
        <Columns3 size={14} />
        Columns
      </button>

      {open && (
        <div className="absolute z-50 right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2">
          {ALL_COLS.map((col) => {
            const checked = visible.has(col.key);
            const isName = col.key === "name";
            return (
              <label
                key={col.key}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  isName ? "text-slate-400 cursor-default" : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isName}
                  onChange={(e) => onChange(col.key, e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-blue-600"
                />
                {col.label}
                {isName && <span className="ml-auto text-xs text-slate-300">always</span>}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Screener({
  products,
  categories,
  suppliers,
  initialSearch = "",
  initialCategoryId = "",
  initialSupplierId = "",
}: ScreenerProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  type SortKey = "name" | "purchasePrice" | "salePrice" | "inStock" | "weight" | "category" | "supplier" | "shelfLocation";
  type SortDir = "asc" | "desc";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const [colWidths, setColWidths] = useState<Partial<Record<string, number>>>({});
  const dragRef = useRef<{ key: string; startX: number; startWidth: number; minWidth: number } | null>(null);

  function startResize(key: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).parentElement as HTMLTableCellElement;
    // measure header text natural width as minimum (span for SortTh, th itself for static headers)
    const inner = th.querySelector("span") ?? th;
    const minWidth = (inner as HTMLElement).scrollWidth + 32; // 32px for padding

    dragRef.current = { key, startX: e.clientX, startWidth: th.offsetWidth, minWidth };

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return;
      const newWidth = Math.max(dragRef.current.minWidth, dragRef.current.startWidth + ev.clientX - dragRef.current.startX);
      setColWidths((prev) => ({ ...prev, [dragRef.current!.key]: newWidth }));
    }
    function onUp() {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function ResizeHandle({ colKey }: { colKey: string }) {
    return (
      <div
        onMouseDown={(e) => startResize(colKey, e)}
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize group"
      >
        <div className="mx-auto w-px h-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
      </div>
    );
  }

  function toggleExpand(id: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(() => {
    try {
      const saved = localStorage.getItem("screener-cols");
      if (saved) {
        const parsed: ColKey[] = JSON.parse(saved);
        return new Set(parsed.filter((k) => ALL_COLS.some((c) => c.key === k)));
      }
    } catch {}
    return new Set(ALL_COLS.filter((c) => c.defaultOn).map((c) => c.key));
  });

  function toggleCol(key: ColKey, on: boolean) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      localStorage.setItem("screener-cols", JSON.stringify([...next]));
      return next;
    });
  }

  const syncUrl = useCallback(
    (q: string, cat: string, sup: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (cat) params.set("category", cat);
      if (sup) params.set("supplier", sup);
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [router]
  );

  function handleSearch(v: string) { setSearch(v); syncUrl(v, categoryId, supplierId); }
  function handleCategory(v: string) { setCategoryId(v); syncUrl(search, v, supplierId); }
  function handleSupplier(v: string) { setSupplierId(v); syncUrl(search, categoryId, v); }

  function clearAll() {
    setSearch(""); setCategoryId(""); setSupplierId("");
    router.replace("/", { scroll: false });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.slug ?? "").toLowerCase().includes(q);
      const matchesCategory = !categoryId || String(p.category?.id) === categoryId;
      const matchesSupplier = !supplierId || String(p.brand_supplier?.id) === supplierId;
      return matchesSearch && matchesCategory && matchesSupplier;
    });

    if (!sortKey) return list;

    return [...list].sort((a, b) => {
      let av: string | number | null | undefined;
      let bv: string | number | null | undefined;
      if (sortKey === "name")          { av = a.name;                    bv = b.name; }
      else if (sortKey === "purchasePrice") { av = a.purchase_price ?? null; bv = b.purchase_price ?? null; }
      else if (sortKey === "salePrice")     { av = lowestSalePrice(a);       bv = lowestSalePrice(b); }
      else if (sortKey === "inStock")       { av = a.in_stock ?? null;        bv = b.in_stock ?? null; }
      else if (sortKey === "weight")        { av = a.weight_variants?.[0]?.weight ?? ""; bv = b.weight_variants?.[0]?.weight ?? ""; }
      else if (sortKey === "category")      { av = a.category?.name ?? "";   bv = b.category?.name ?? ""; }
      else if (sortKey === "supplier")      { av = a.brand_supplier?.name ?? ""; bv = b.brand_supplier?.name ?? ""; }
      else if (sortKey === "shelfLocation") { av = a.shelf_location ?? "";   bv = b.shelf_location ?? ""; }

      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [products, search, categoryId, supplierId, sortKey, sortDir]);

  const hasFilters = search || categoryId || supplierId;
  const show = (key: ColKey) => visibleCols.has(key);

  function SortTh({ sk, label, align = "left", icon: ColIcon }: { sk: SortKey; label: string; align?: "left" | "right"; icon?: React.ElementType }) {
    const active = sortKey === sk;
    const SortIcon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
    return (
      <th
        onClick={() => handleSort(sk)}
        style={{ width: colWidths[sk] }}
        className={`relative text-xs font-medium uppercase tracking-wide px-4 py-3 cursor-pointer select-none whitespace-nowrap text-${align} ${active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
      >
        <span className={`inline-flex items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
          {ColIcon && <ColIcon size={12} className="flex-shrink-0" />}
          {label}
          <SortIcon size={12} className={active ? "text-blue-500" : "text-slate-300"} />
        </span>
        <ResizeHandle colKey={sk} />
      </th>
    );
  }

  function StaticTh({ colKey, label, icon: ColIcon, align = "left" }: { colKey: string; label: string; icon?: React.ElementType; align?: "left" | "right" }) {
    return (
      <th
        style={{ width: colWidths[colKey] }}
        className={`relative text-xs font-medium uppercase tracking-wide px-4 py-3 whitespace-nowrap text-slate-400 text-${align}`}
      >
        <span className={`inline-flex items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}>
          {ColIcon && <ColIcon size={12} className="flex-shrink-0" />}
          {label}
        </span>
        <ResizeHandle colKey={colKey} />
      </th>
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or slug…"
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
          {search && (
            <button onClick={() => handleSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <Dropdown
          value={categoryId}
          onChange={handleCategory}
          placeholder="All Categories"
          options={categories.map((c) => ({
            value: String(c.id),
            label: c.parent_category
              ? `${categories.find((x) => x.id === c.parent_category?.id)?.name ?? ""} › ${c.name}`
              : c.name,
            indent: !!c.parent_category,
          }))}
        />

        {/* Supplier filter */}
        <Dropdown
          value={supplierId}
          onChange={handleSupplier}
          placeholder="All Suppliers"
          options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
        />

        {/* Clear all */}
        {hasFilters && (
          <button onClick={clearAll} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-700 transition-colors">
            <X size={13} /> Clear all
          </button>
        )}

        {/* Count */}
        <span className="text-sm text-slate-400 ml-auto">
          {filtered.length} of {products.length} products
        </span>

        {/* Column picker */}
        <ColPicker visible={visibleCols} onChange={toggleCol} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-slate-400">
            No products match your filters.
          </div>
        ) : (
          <table className="w-full text-base" style={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
            <thead>
              <tr className="border-b border-slate-100">
                <th className="w-8 px-2 py-3 relative" style={{ width: colWidths["chevron"] ?? 32 }}>
                  <ResizeHandle colKey="chevron" />
                </th>
                {show("no")            && <StaticTh colKey="no"           label="No."           icon={Hash}          />}
                {show("image")         && <StaticTh colKey="image"         label="Image"         icon={ImageIcon}     />}
                {show("name")          && <SortTh sk="name"          label="Name"           icon={Tag}           />}
                {show("sizes")         && <StaticTh colKey="sizes"         label="Sizes"         icon={Ruler}         />}
                {show("weight")        && <SortTh sk="weight"        label="Weight"         icon={Weight}        />}
                {show("colors")        && <StaticTh colKey="colors"        label="Colors"        icon={Palette}       />}
                {show("category")      && <SortTh sk="category"      label="Category"       icon={FolderTree}    />}
                {show("supplier")      && <SortTh sk="supplier"      label="Supplier"       icon={Truck}         />}
                {show("purchasePrice") && <SortTh sk="purchasePrice" label="Purchase Price" icon={ShoppingCart}  align="right" />}
                {show("salePrice")     && <SortTh sk="salePrice"     label="Sale Price"     icon={BadgeDollarSign} align="right" />}
                {show("inStock")       && <SortTh sk="inStock"       label="In Stock"       icon={Package}       align="right" />}
                {show("shelfLocation") && <StaticTh colKey="shelfLocation" label="Shelf Location" icon={MapPin}     />}
                {show("lastUpdated")   && <StaticTh colKey="lastUpdated"   label="Last Updated"   icon={CalendarDays} />}
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-4 py-3" style={{ width: colWidths["actions"] ?? 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => {
                const hasVariants = (product.variant_type === "weight" && !!product.weight_variants?.length) ||
                  (product.variant_type === "size" && !!product.sizes?.length);
                const isExpanded = expandedRows.has(product.id);
                const colSpan = 1 + ALL_COLS.filter((c) => show(c.key)).length + 1; // chevron + visible + actions

                return (
                <React.Fragment key={product.id}>
                <tr
                  className={i < filtered.length - 1 || isExpanded ? "border-b border-slate-100 hover:bg-slate-50" : "hover:bg-slate-50"}
                >
                  <td className="px-2 py-3 w-8">
                    {hasVariants && (
                      <button type="button" onClick={() => toggleExpand(product.id)}
                        className="p-0.5 text-red-500 hover:text-red-700 transition-colors rounded">
                        <ChevronRight size={20} strokeWidth={3} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </button>
                    )}
                  </td>
                  {show("no") && (
                    <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">{i + 1}</td>
                  )}

                  {show("image") && (
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {product.picture ? (
                          <Image
                            src={`http://localhost:1337${product.picture.formats?.thumbnail?.url ?? product.picture.url}`}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  )}

                  {show("name") && (
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/products/${product.documentId}/edit`}
                        className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {toPascalCase(product.name)}
                      </Link>
                      {product.code && <p className="text-xs text-slate-400 mt-0.5">{product.code}</p>}
                    </td>
                  )}

                  {show("sizes") && (
                    <td className="px-4 py-3">
                      {product.sizes && product.sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.map((s, idx) => (
                            <span key={idx} className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                              {s.value} {s.unit}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                  )}

                  {show("weight") && (
                    <td className="px-4 py-3">
                      {product.weight_variants && product.weight_variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.weight_variants.map((v, idx) => (
                            <span key={idx} className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${WEIGHT_COLORS[v.weight] ?? "bg-slate-100 text-slate-600"}`}>{v.weight}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                  )}

                  {show("colors") && (
                    <td className="px-4 py-3">
                      {product.colors && product.colors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.colors.map((c, idx) => (
                            <span key={idx} className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                              {c.value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                  )}

                  {show("category") && (
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {product.category ? (
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {toPascalCase(product.category.name)}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  )}

                  {show("supplier") && (
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {product.brand_supplier ? (() => {
                        const c = getSupplierColor(product.brand_supplier.color);
                        return (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full font-semibold"
                            style={{ backgroundColor: c.bg, color: c.text }}>
                            {toPascalCase(product.brand_supplier.name)}
                          </span>
                        );
                      })() : <span className="text-slate-300">—</span>}
                    </td>
                  )}

                  {show("purchasePrice") && (
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                      {product.purchase_price != null
                        ? `Rs ${product.purchase_price.toLocaleString()}`
                        : <span className="text-slate-300 font-normal">—</span>}
                    </td>
                  )}

                  {show("salePrice") && (
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                      {priceDisplay(product) !== "—"
                        ? priceDisplay(product)
                        : <span className="text-slate-300 font-normal">—</span>}
                    </td>
                  )}

                  {show("inStock") && (
                    <td className="px-4 py-3 text-sm text-slate-500 text-right">
                      {product.variant_type === "weight" && product.weight_variants?.length
                        ? product.weight_variants.reduce((s, v) =>
                            s + (v.variant_colors?.length
                              ? v.variant_colors.reduce((cs, c) => cs + (c.in_stock ?? 0), 0)
                              : (v.in_stock ?? 0)), 0)
                        : product.variant_type === "size" && product.sizes?.length
                        ? product.sizes.reduce((s, v) =>
                            s + (v.variant_colors?.length
                              ? v.variant_colors.reduce((cs, c) => cs + (c.in_stock ?? 0), 0)
                              : (v.in_stock ?? 0)), 0)
                        : (product.in_stock ?? "—")}
                    </td>
                  )}

                  {show("shelfLocation") && (
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {product.shelf_location ?? <span className="text-slate-300">—</span>}
                    </td>
                  )}
                  {show("lastUpdated") && (
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {product.last_updated
                        ? new Date(product.last_updated).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-")
                        : <span className="text-slate-300">—</span>}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <ProductActions productId={product.documentId} productName={product.name} />
                  </td>
                </tr>

                {/* Variant price breakdown sub-row */}
                {hasVariants && isExpanded && (
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td colSpan={colSpan} className="px-6 py-3">
                      <table className="text-xs">
                        <thead>
                          <tr className="text-slate-400">
                            <th className="text-left font-medium pr-8 pb-1">
                              {product.variant_type === "weight" ? "Weight" : "Size"}
                            </th>
                            <th className="text-right font-medium pr-6 pb-1">Purchase Price</th>
                            <th className="text-right font-medium pr-6 pb-1">Sale Price</th>
                            <th className="text-right font-medium pb-1">In Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.variant_type === "weight" && product.weight_variants?.map((v, idx) => (
                            <React.Fragment key={idx}>
                              <tr>
                                <td className="pr-8 py-0.5">
                                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${WEIGHT_COLORS[v.weight] ?? "bg-slate-100 text-slate-600"}`}>{v.weight}</span>
                                </td>
                                <td className="pr-6 py-0.5 text-right text-slate-500 tabular-nums">
                                  {v.purchase_price != null ? `Rs ${v.purchase_price.toLocaleString()}` : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="pr-6 py-0.5 text-right text-slate-700 font-medium tabular-nums">
                                  {v.sale_price != null ? `Rs ${v.sale_price.toLocaleString()}` : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="py-0.5 text-right text-slate-500 tabular-nums">
                                  {v.variant_colors?.length
                                    ? v.variant_colors.reduce((s, c) => s + (c.in_stock ?? 0), 0)
                                    : v.in_stock != null ? v.in_stock : <span className="text-slate-300">—</span>}
                                </td>
                              </tr>
                              {v.variant_colors?.map((c, ci) => (
                                <tr key={ci} className="text-slate-400">
                                  <td className="pl-4 pr-8 py-0.5">↳ {c.value}</td>
                                  <td className="pr-6" />
                                  <td className="pr-6" />
                                  <td className="py-0.5 text-right tabular-nums">{c.in_stock ?? <span className="text-slate-300">—</span>}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                          {product.variant_type === "size" && product.sizes?.map((s, idx) => (
                            <React.Fragment key={idx}>
                              <tr>
                                <td className="pr-8 py-0.5 text-slate-700 font-medium">{s.value} {s.unit}</td>
                                <td className="pr-6 py-0.5 text-right text-slate-500 tabular-nums">
                                  {s.purchase_price != null ? `Rs ${s.purchase_price.toLocaleString()}` : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="pr-6 py-0.5 text-right text-slate-700 font-medium tabular-nums">
                                  {s.sale_price != null ? `Rs ${s.sale_price.toLocaleString()}` : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="py-0.5 text-right text-slate-500 tabular-nums">
                                  {s.variant_colors?.length
                                    ? s.variant_colors.reduce((sum, c) => sum + (c.in_stock ?? 0), 0)
                                    : s.in_stock != null ? s.in_stock : <span className="text-slate-300">—</span>}
                                </td>
                              </tr>
                              {s.variant_colors?.map((c, ci) => (
                                <tr key={ci} className="text-slate-400">
                                  <td className="pl-4 pr-8 py-0.5">↳ {c.value}</td>
                                  <td className="pr-6" />
                                  <td className="pr-6" />
                                  <td className="py-0.5 text-right tabular-nums">{c.in_stock ?? <span className="text-slate-300">—</span>}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
                </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
