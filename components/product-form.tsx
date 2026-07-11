"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Upload, Save, AlertCircle, Plus, X, CheckCircle, ArrowLeft, Trash2 } from "lucide-react";
import clsx from "clsx";
import ChipInput from "./chip-input";
import { Dropdown } from "./dropdown";
import type {
  Product, Category, BrandSupplier,
  SizeUnit, SizeEntry, WeightUnit, WeightVariant, VariantType, VariantColor,
} from "@/lib/types";
import { createProduct, updateProduct, uploadProductImage } from "@/lib/api";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  suppliers: BrandSupplier[];
}

const SIZE_UNITS: SizeUnit[] = ["inch", "foot", "meter"];
const WEIGHT_UNITS: WeightUnit[] = ["Dabbi", "Quarter", "Gallon", "Bucket"];

type SaveState = "idle" | "saving" | "saved";

function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
}

function buildCategoryLabel(cat: Category, all: Category[]): string {
  if (cat.parent_category) {
    const parent = all.find((c) => c.id === cat.parent_category?.id);
    if (parent) return `${parent.name} > ${cat.name}`;
  }
  return cat.name;
}

// ── Price pair input ──────────────────────────────────────────────────────────
function PricePair({
  purchase, sale,
  onPurchase, onSale,
  required = false,
}: {
  purchase: string; sale: string;
  onPurchase: (v: string) => void; onSale: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Purchase Price</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rs</span>
          <input type="number" min="0" step="0.01" value={purchase} onChange={(e) => onPurchase(e.target.value)} placeholder="0.00"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">
          Sale Price {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rs</span>
          <input type="number" min="0" step="0.01" value={sale} onChange={(e) => onSale(e.target.value)} placeholder="0.00"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200" />
        </div>
      </div>
    </div>
  );
}

// ── Variant color editor (per-variant colors with quantities) ─────────────────
function VariantColorEditor({
  colors,
  onChange,
}: {
  colors: VariantColor[];
  onChange: (c: VariantColor[]) => void;
}) {
  const [newColor, setNewColor] = useState("");

  function add() {
    const val = newColor.trim();
    if (!val) return;
    onChange([...colors, { value: val, in_stock: null }]);
    setNewColor("");
  }

  function remove(idx: number) {
    onChange(colors.filter((_, i) => i !== idx));
  }

  function updateQty(idx: number, val: string) {
    onChange(colors.map((c, i) =>
      i === idx ? { ...c, in_stock: val === "" ? null : parseInt(val, 10) } : c
    ));
  }

  return (
    <div className="mt-2 pl-3 border-l-2 border-slate-100 space-y-1.5">
      {colors.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-600 w-24 truncate">{c.value}</span>
          <input
            type="number" min="0"
            value={c.in_stock ?? ""}
            onChange={(e) => updateQty(i, e.target.value)}
            placeholder="Qty"
            className="w-20 px-2 py-1 border border-slate-200 rounded-md text-xs outline-none focus:border-slate-400 bg-white"
          />
          <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-500 transition-colors">
            <X size={12} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-0.5">
        <input
          type="text"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Color name…"
          className="w-28 px-2 py-1 border border-slate-200 rounded-md text-xs outline-none focus:border-slate-400"
        />
        <button type="button" onClick={add} disabled={!newColor.trim()}
          className="inline-flex items-center gap-0.5 px-2 py-1 border border-slate-200 rounded-md text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
          <Plus size={11} /> Color
        </button>
      </div>
    </div>
  );
}

// ── Weight variant editor ─────────────────────────────────────────────────────
function WeightVariantEditor({
  variants, onChange,
}: {
  variants: WeightVariant[];
  onChange: (v: WeightVariant[]) => void;
}) {
  const [addWeight, setAddWeight] = useState<WeightUnit | "">("");

  function add() {
    if (!addWeight) return;
    onChange([...variants, { weight: addWeight as WeightUnit, purchase_price: null, sale_price: null, in_stock: null, variant_colors: [] }]);
    setAddWeight("");
  }

  function remove(idx: number) {
    onChange(variants.filter((_, i) => i !== idx));
  }

  function update(idx: number, field: "purchase_price" | "sale_price" | "in_stock", val: string) {
    onChange(variants.map((v, i) =>
      i === idx ? { ...v, [field]: val === "" ? null : field === "in_stock" ? parseInt(val, 10) : parseFloat(val) } : v
    ));
  }

  function updateColors(idx: number, colors: VariantColor[]) {
    onChange(variants.map((v, i) => i === idx ? { ...v, variant_colors: colors } : v));
  }

  const usedWeights = new Set(variants.map((v) => v.weight));

  return (
    <div className="space-y-3">
      {variants.map((v, i) => (
        <div key={i} className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 w-20 flex-shrink-0">{v.weight}</span>
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs</span>
                <input type="number" min="0" step="0.01"
                  value={v.purchase_price ?? ""}
                  onChange={(e) => update(i, "purchase_price", e.target.value)}
                  placeholder="Buy"
                  className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 bg-white"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs</span>
                <input type="number" min="0" step="0.01"
                  value={v.sale_price ?? ""}
                  onChange={(e) => update(i, "sale_price", e.target.value)}
                  placeholder="Sell"
                  className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 bg-white"
                />
              </div>
              <input type="number" min="0"
                value={v.in_stock ?? ""}
                onChange={(e) => update(i, "in_stock", e.target.value)}
                placeholder={v.variant_colors?.length ? "Default qty" : "Qty"}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 bg-white"
              />
            </div>
            <button type="button" onClick={() => remove(i)} className="p-1 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
          <VariantColorEditor colors={v.variant_colors ?? []} onChange={(c) => updateColors(i, c)} />
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Dropdown
          value={addWeight}
          onChange={(v) => setAddWeight(v as WeightUnit)}
          placeholder="Select weight…"
          options={WEIGHT_UNITS.filter((w) => !usedWeights.has(w)).map((w) => ({ value: w, label: w }))}
        />
        <button type="button" onClick={add} disabled={!addWeight}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

// ── Size variant editor ───────────────────────────────────────────────────────
function SizeVariantEditor({
  sizes, onChange,
}: {
  sizes: SizeEntry[];
  onChange: (v: SizeEntry[]) => void;
}) {
  const [addValue, setAddValue] = useState("");
  const [addUnit, setAddUnit] = useState<SizeUnit>("inch");

  function add() {
    const num = parseFloat(addValue);
    if (isNaN(num) || num <= 0) return;
    onChange([...sizes, { value: num, unit: addUnit, purchase_price: null, sale_price: null, in_stock: null, variant_colors: [] }]);
    setAddValue("");
  }

  function remove(idx: number) {
    onChange(sizes.filter((_, i) => i !== idx));
  }

  function update(idx: number, field: "purchase_price" | "sale_price" | "in_stock", val: string) {
    onChange(sizes.map((s, i) =>
      i === idx ? { ...s, [field]: val === "" ? null : field === "in_stock" ? parseInt(val, 10) : parseFloat(val) } : s
    ));
  }

  function updateColors(idx: number, colors: VariantColor[]) {
    onChange(sizes.map((s, i) => i === idx ? { ...s, variant_colors: colors } : s));
  }

  return (
    <div className="space-y-3">
      {sizes.map((s, i) => (
        <div key={i} className="p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 w-20 flex-shrink-0">{s.value} {s.unit}</span>
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs</span>
                <input type="number" min="0" step="0.01"
                  value={s.purchase_price ?? ""}
                  onChange={(e) => update(i, "purchase_price", e.target.value)}
                  placeholder="Buy"
                  className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 bg-white"
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs</span>
                <input type="number" min="0" step="0.01"
                  value={s.sale_price ?? ""}
                  onChange={(e) => update(i, "sale_price", e.target.value)}
                  placeholder="Sell"
                  className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 bg-white"
                />
              </div>
              <input type="number" min="0"
                value={s.in_stock ?? ""}
                onChange={(e) => update(i, "in_stock", e.target.value)}
                placeholder={s.variant_colors?.length ? "Default qty" : "Qty"}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 bg-white"
              />
            </div>
            <button type="button" onClick={() => remove(i)} className="p-1 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
          <VariantColorEditor colors={s.variant_colors ?? []} onChange={(c) => updateColors(i, c)} />
        </div>
      ))}

      <div className="flex items-center gap-2">
        <input type="number" min="0" step="any" value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="e.g. 2.5"
          className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
        />
        <Dropdown value={addUnit} onChange={(v) => setAddUnit(v as SizeUnit)} placeholder="inch" clearable={false}
          options={SIZE_UNITS.map((u) => ({ value: u, label: u }))} />
        <button type="button" onClick={add}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function ProductForm({ product, categories, suppliers }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [code, setCode] = useState(product?.code ?? "");
  const [material, setMaterial] = useState(product?.material ?? "");

  const [variantType, setVariantType] = useState<VariantType>(product?.variant_type ?? "none");
  const [purchasePrice, setPurchasePrice] = useState(product?.purchase_price?.toString() ?? "");
  const [salePrice, setSalePrice] = useState(product?.sale_price?.toString() ?? "");
  const [weightVariants, setWeightVariants] = useState<WeightVariant[]>(product?.weight_variants ?? []);
  const [sizes, setSizes] = useState<SizeEntry[]>(product?.sizes ?? []);

  const [inStock, setInStock] = useState(product?.in_stock?.toString() ?? "");
  const [shelfLocation, setShelfLocation] = useState(product?.shelf_location ?? "");
  const [colors, setColors] = useState<string[]>(product?.colors?.map((c) => c.value) ?? []);
  const [categoryId, setCategoryId] = useState<string>(product?.category?.id?.toString() ?? "");
  const [supplierId, setSupplierId] = useState<string>(product?.brand_supplier?.id?.toString() ?? "");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const lastUpdated = product?.last_updated ?? today;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate: need at least one sale price
    if (variantType === "none" && !salePrice) {
      setError("Sale price is required.");
      return;
    }

    setSaveState("saving");
    try {
      const payload = {
        name,
        slug: slugify(name),
        description: description || undefined,
        code: code || undefined,
        material: material || undefined,
        variant_type: variantType,
        purchase_price: variantType === "none" && purchasePrice ? parseFloat(purchasePrice) : null,
        sale_price: variantType === "none" && salePrice ? parseFloat(salePrice) : null,
        weight_variants: variantType === "weight"
          ? weightVariants.map(({ weight, purchase_price, sale_price, in_stock, variant_colors }) => ({
              weight, purchase_price, sale_price, in_stock,
              variant_colors: (variant_colors ?? []).map(({ value, in_stock: qty }) => ({ value, in_stock: qty })),
            }))
          : [],
        sizes: variantType === "size"
          ? sizes.map(({ value, unit, purchase_price, sale_price, in_stock, variant_colors }) => ({
              value, unit, purchase_price, sale_price, in_stock,
              variant_colors: (variant_colors ?? []).map(({ value: v, in_stock: qty }) => ({ value: v, in_stock: qty })),
            }))
          : variantType === "none"
          ? sizes.map(({ value, unit }) => ({ value, unit, purchase_price: null, sale_price: null, in_stock: null, variant_colors: [] }))
          : [],
        colors: colors.map((v) => ({ value: v })),
        in_stock: inStock ? parseInt(inStock, 10) : undefined,
        shelf_location: shelfLocation || undefined,
        last_updated: today,
        category: categoryId ? parseInt(categoryId, 10) : null,
        brand_supplier: supplierId ? parseInt(supplierId, 10) : null,
      };

      let saved: Product;
      if (isEdit) {
        saved = await updateProduct(product.documentId, payload);
      } else {
        saved = await createProduct(payload);
      }

      if (imageFile) {
        await uploadProductImage(saved.id, imageFile);
      }

      setSaveState("saved");
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaveState("idle");
    }
  }

  const existingImageUrl = product?.picture?.url ? `http://localhost:1337${product.picture.url}` : null;
  const displayImage = imagePreview ?? existingImageUrl;

  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200";

  return (
    <>
      {/* Save overlay */}
      <div className={clsx(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 transition-all duration-300",
        saveState === "idle" ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto bg-white/80 backdrop-blur-sm"
      )}>
        {saveState === "saving" && (
          <>
            <div className="w-10 h-10 border-[3px] border-teal-100 border-t-teal-700 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Saving product…</p>
          </>
        )}
        {saveState === "saved" && (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">Saved!</p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
              <ArrowLeft size={15} /> Back
            </Link>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Product" : "New Product"}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{isEdit ? `Editing: ${product.name}` : "Add a new product to the catalog"}</p>
            </div>
          </div>
          <button type="submit" disabled={saveState !== "idle"}
            className={clsx("inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg",
              "hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed")}>
            <Save size={15} /> Save Product
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          {/* LEFT */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">

              {/* Name */}
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="e.g. Stainless Steel Bolt Set" className={inputCls} />
              </div>

              {/* Variant type toggle */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Pricing Type</p>
                <div className="flex gap-2">
                  {(["none", "weight", "size"] as VariantType[]).map((t) => (
                    <button key={t} type="button" onClick={() => setVariantType(t)}
                      className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors", variantType === t
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}>
                      {t === "none" ? "Single Price" : t === "weight" ? "By Weight" : "By Size"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing — single */}
              {variantType === "none" && (
                <div className="px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Pricing</p>
                  <PricePair purchase={purchasePrice} sale={salePrice}
                    onPurchase={setPurchasePrice} onSale={setSalePrice} required />
                </div>
              )}

              {/* Pricing — by weight */}
              {variantType === "weight" && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500">Weight Variants</p>
                    <span className="text-xs text-slate-400">Leave blank if not applicable</span>
                  </div>
                  {weightVariants.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 px-3 mb-1 ml-[88px]">
                      <span className="text-xs text-slate-400">Buy Price</span>
                      <span className="text-xs text-slate-400">Sell Price</span>
                      <span className="text-xs text-slate-400">Qty</span>
                    </div>
                  )}
                  <WeightVariantEditor variants={weightVariants} onChange={setWeightVariants} />
                </div>
              )}

              {/* Pricing — by size */}
              {variantType === "size" && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500">Size Variants</p>
                    <span className="text-xs text-slate-400">Leave blank if not applicable</span>
                  </div>
                  {sizes.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 px-3 mb-1 ml-[88px]">
                      <span className="text-xs text-slate-400">Buy Price</span>
                      <span className="text-xs text-slate-400">Sell Price</span>
                      <span className="text-xs text-slate-400">Qty</span>
                    </div>
                  )}
                  <SizeVariantEditor sizes={sizes} onChange={setSizes} />
                </div>
              )}

              {/* Sizes (non-variant — shown only when type = none) */}
              {variantType === "none" && (
                <div className="px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Sizes</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {sizes.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                        {s.value} {s.unit}
                        <button type="button" onClick={() => setSizes(sizes.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-slate-700 transition-colors"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" step="any" placeholder="e.g. 2.5"
                      id="size-add-val"
                      className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const inp = e.currentTarget;
                          const num = parseFloat(inp.value);
                          if (!isNaN(num) && num > 0) {
                            setSizes([...sizes, { value: num, unit: "inch" }]);
                            inp.value = "";
                          }
                        }
                      }}
                    />
                    <Dropdown value="inch" onChange={() => {}} placeholder="inch" clearable={false}
                      options={SIZE_UNITS.map((u) => ({ value: u, label: u }))} />
                    <button type="button"
                      onClick={() => {
                        const inp = document.getElementById("size-add-val") as HTMLInputElement;
                        const num = parseFloat(inp?.value ?? "");
                        if (!isNaN(num) && num > 0) {
                          setSizes([...sizes, { value: num, unit: "inch" }]);
                          inp.value = "";
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                      <Plus size={13} /> Add
                    </button>
                  </div>
                </div>
              )}

              {/* Inventory */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Inventory</p>
                <div className={variantType === "none" ? "grid grid-cols-2 gap-3" : ""}>
                  {variantType === "none" && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">In Stock</label>
                      <input type="number" min="0" value={inStock} onChange={(e) => setInStock(e.target.value)} placeholder="0" className={inputCls} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Shelf Location</label>
                    <input type="text" value={shelfLocation} onChange={(e) => setShelfLocation(e.target.value)} placeholder="e.g. A3-Row2" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Colors</p>
                <ChipInput label="Available colors" values={colors} onChange={setColors} />
              </div>

              {/* Description */}
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  placeholder="Describe the product…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 resize-none" />
              </div>

              {/* Material */}
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Material</label>
                <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. Stainless Steel" className={inputCls} />
              </div>

            </div>
          </div>

          {/* RIGHT */}
          <div className="col-span-1 space-y-3">

            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Code / SKU</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SKU-001" className={inputCls} />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Image</p>
              <div onClick={() => fileInputRef.current?.click()}
                className={clsx("border-2 border-dashed border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-slate-400 transition-colors",
                  displayImage ? "aspect-square" : "aspect-video")}>
                {displayImage ? (
                  <Image src={displayImage} alt="Product" width={400} height={400} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 py-8">
                    <Upload size={20} />
                    <span className="text-xs text-center px-4">Click to upload</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              {displayImage && <p className="text-xs text-slate-400 mt-2 text-center">Click to change</p>}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <Dropdown value={categoryId} onChange={setCategoryId} placeholder="— None —" fullWidth
                  options={categories.map((cat) => ({ value: cat.id.toString(), label: buildCategoryLabel(cat, categories), indent: !!cat.parent_category }))} />
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Brand / Supplier</label>
                <Dropdown value={supplierId} onChange={setSupplierId} placeholder="— None —" fullWidth
                  options={suppliers.map((s) => ({ value: s.id.toString(), label: s.name }))} />
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Last Updated</label>
                <input type="date" value={lastUpdated} readOnly
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 bg-slate-50 cursor-default" />
              </div>
            </div>

          </div>
        </div>
      </form>
    </>
  );
}
