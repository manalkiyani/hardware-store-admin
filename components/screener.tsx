"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product, Category, BrandSupplier } from "@/lib/types";
import { Dropdown } from "./dropdown";

interface ScreenerProps {
  products: Product[];
  categories: Category[];
  suppliers: BrandSupplier[];
  initialSearch?: string;
  initialCategoryId?: string;
  initialSupplierId?: string;
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

  function handleSearch(v: string) {
    setSearch(v);
    syncUrl(v, categoryId, supplierId);
  }

  function handleCategory(v: string) {
    setCategoryId(v);
    syncUrl(search, v, supplierId);
  }

  function handleSupplier(v: string) {
    setSupplierId(v);
    syncUrl(search, categoryId, v);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.slug ?? "").toLowerCase().includes(q);

      const matchesCategory =
        !categoryId || String(p.category?.id) === categoryId;

      const matchesSupplier =
        !supplierId || String(p.brand_supplier?.id) === supplierId;

      return matchesSearch && matchesCategory && matchesSupplier;
    });
  }, [products, search, categoryId, supplierId]);

  const hasFilters = search || categoryId || supplierId;

  function clearAll() {
    setSearch("");
    setCategoryId("");
    setSupplierId("");
    router.replace("/", { scroll: false });
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
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-100"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
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
          options={suppliers.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))}
        />

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={13} /> Clear all
          </button>
        )}

        {/* Count */}
        <span className="text-sm text-slate-400 ml-auto">
          {filtered.length} of {products.length} products
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-slate-400">
            No products match your filters.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-4 py-3 w-10">
                  No.
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-4 py-3 w-14">
                  Image
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-4 py-3">
                  Sizes
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-4 py-3">
                  Colors
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-4 py-3">
                  Purchase Price
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-4 py-3">
                  In Stock
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr
                  key={product.id}
                  className={
                    i < filtered.length - 1
                      ? "border-b border-slate-100 hover:bg-slate-50"
                      : "hover:bg-slate-50"
                  }
                >
                  {/* No. */}
                  <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">
                    {i + 1}
                  </td>

                  {/* Image */}
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

                  {/* Name + code */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/products/${product.documentId}/edit`}
                      className="text-sm font-medium text-slate-900 hover:text-teal-700 transition-colors"
                    >
                      {product.name}
                    </Link>
                    {product.code && (
                      <p className="text-xs text-slate-400 mt-0.5">{product.code}</p>
                    )}
                  </td>

                  {/* Sizes */}
                  <td className="px-4 py-3">
                    {product.sizes && product.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                          >
                            {s.value} {s.unit}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Colors */}
                  <td className="px-4 py-3">
                    {product.colors && product.colors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.colors.map((c, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                          >
                            {c.value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </td>

                  {/* Purchase Price */}
                  <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium">
                    {product.purchase_price != null
                      ? `Rs ${product.purchase_price.toLocaleString()}`
                      : <span className="text-slate-300 font-normal">—</span>}
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-3 text-sm text-slate-500 text-right">
                    {product.in_stock ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
