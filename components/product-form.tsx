"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Upload, Save, AlertCircle, Plus, X, CheckCircle, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import ChipInput from "./chip-input";
import { Dropdown } from "./dropdown";
import type { Product, Category, BrandSupplier, SizeUnit, SizeEntry, WeightUnit } from "@/lib/types";
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
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function buildCategoryLabel(cat: Category, all: Category[]): string {
  if (cat.parent_category) {
    const parent = all.find((c) => c.id === cat.parent_category?.id);
    if (parent) return `${parent.name} > ${cat.name}`;
  }
  return cat.name;
}

// ── Size editor ──────────────────────────────────────────────────────────────
function SizeEditor({
  sizes,
  onChange,
}: {
  sizes: SizeEntry[];
  onChange: (sizes: SizeEntry[]) => void;
}) {
  const [addValue, setAddValue] = useState("");
  const [addUnit, setAddUnit] = useState<SizeUnit>("inch");

  function add() {
    const num = parseFloat(addValue);
    if (isNaN(num) || num <= 0) return;
    onChange([...sizes, { value: num, unit: addUnit }]);
    setAddValue("");
  }

  function remove(idx: number) {
    onChange(sizes.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      {/* existing chips */}
      {sizes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sizes.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
            >
              {s.value} {s.unit}
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* add row */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="any"
          value={addValue}
          onChange={(e) => setAddValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="e.g. 2.5"
          className="w-28 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
        />
        <Dropdown
          value={addUnit}
          onChange={(v) => setAddUnit(v as SizeUnit)}
          placeholder="inch"
          clearable={false}
          options={SIZE_UNITS.map((u) => ({ value: u, label: u }))}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Plus size={13} /> Add
        </button>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function ProductForm({
  product,
  categories,
  suppliers,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [code, setCode] = useState(product?.code ?? "");
  const [material, setMaterial] = useState(product?.material ?? "");
  const [purchasePrice, setPurchasePrice] = useState(
    product?.purchase_price?.toString() ?? ""
  );
  const [salePrice, setSalePrice] = useState(
    product?.sale_price?.toString() ?? ""
  );
  const [inStock, setInStock] = useState(
    product?.in_stock?.toString() ?? ""
  );
  const [shelfLocation, setShelfLocation] = useState(product?.shelf_location ?? "");
  const [weight, setWeight] = useState<string>(product?.weight ?? "");
  const [sizes, setSizes] = useState<SizeEntry[]>(product?.sizes ?? []);
  const [colors, setColors] = useState<string[]>(
    product?.colors?.map((c) => c.value) ?? []
  );
  const [categoryId, setCategoryId] = useState<string>(
    product?.category?.id?.toString() ?? ""
  );
  const [supplierId, setSupplierId] = useState<string>(
    product?.brand_supplier?.id?.toString() ?? ""
  );

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

    if (!salePrice) {
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
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        sale_price: parseFloat(salePrice),
        weight: (weight as WeightUnit) || null,
        in_stock: inStock ? parseInt(inStock, 10) : undefined,
        shelf_location: shelfLocation || undefined,
        last_updated: today,
        sizes: sizes.map(({ value, unit }) => ({ value, unit })),
        colors: colors.map((v) => ({ value: v })),
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
      // Show success state briefly, then navigate with a smooth transition
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaveState("idle");
    }
  }

  const existingImageUrl = product?.picture?.url
    ? `http://localhost:1337${product.picture.url}`
    : null;

  const displayImage = imagePreview ?? existingImageUrl;

  return (
    <>
      {/* ── Save overlay ─────────────────────────────────────────────────── */}
      <div
        className={clsx(
          "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 transition-all duration-300",
          saveState === "idle"
            ? "opacity-0 pointer-events-none"
            : "opacity-100 pointer-events-auto bg-white/80 backdrop-blur-sm"
        )}
      >
        {saveState === "saving" && (
          <>
            <div className="w-10 h-10 border-[3px] border-teal-100 border-t-teal-700 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600">Saving product…</p>
          </>
        )}
        {saveState === "saved" && (
          <>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center animate-[scale-in_0.2s_ease-out]">
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
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-700 transition-colors"
            >
              <ArrowLeft size={15} />
              Back
            </Link>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {isEdit ? "Edit Product" : "New Product"}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEdit
                  ? `Editing: ${product.name}`
                  : "Add a new product to the catalog"}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saveState !== "idle"}
            className={clsx(
              "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg",
              "hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Save size={15} />
            Save Product
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-5">
          {/* LEFT — single box */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">

              {/* Name */}
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Stainless Steel Bolt Set"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* Weight */}
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Weight
                </label>
                <Dropdown
                  value={weight}
                  onChange={setWeight}
                  placeholder="Select weight…"
                  fullWidth
                  options={WEIGHT_UNITS.map((w) => ({ value: w, label: w }))}
                />
              </div>

              {/* Pricing */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Purchase Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rs</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sale Price <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">Rs</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        required
                        placeholder="0.00"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Inventory</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">In Stock</label>
                    <input
                      type="number" min="0"
                      value={inStock}
                      onChange={(e) => setInStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Shelf Location</label>
                    <input
                      type="text"
                      value={shelfLocation}
                      onChange={(e) => setShelfLocation(e.target.value)}
                      placeholder="e.g. A3-Row2"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Sizes */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Sizes</p>
                <SizeEditor sizes={sizes} onChange={setSizes} />
              </div>

              {/* Colors */}
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Colors</p>
                <ChipInput label="Available colors" values={colors} onChange={setColors} />
              </div>

              {/* Description */}
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe the product…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 resize-none"
                />
              </div>

              {/* Material */}
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Material</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. Stainless Steel"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
                />
              </div>

            </div>
          </div>

          {/* RIGHT */}
          <div className="col-span-1 space-y-3">

            {/* Code above image */}
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Code / SKU</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SKU-001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
              />
            </div>

            {/* Image */}
            <div className="bg-white rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Image</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "border-2 border-dashed border-slate-200 rounded-lg overflow-hidden cursor-pointer",
                  "hover:border-slate-400 transition-colors",
                  displayImage ? "aspect-square" : "aspect-video"
                )}
              >
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt="Product"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
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

            {/* Category + Supplier + Last Updated — one box */}
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <Dropdown
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="— None —"
                  fullWidth
                  options={categories.map((cat) => ({
                    value: cat.id.toString(),
                    label: buildCategoryLabel(cat, categories),
                    indent: !!cat.parent_category,
                  }))}
                />
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Brand / Supplier</label>
                <Dropdown
                  value={supplierId}
                  onChange={setSupplierId}
                  placeholder="— None —"
                  fullWidth
                  options={suppliers.map((s) => ({ value: s.id.toString(), label: s.name }))}
                />
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Last Updated</label>
                <input
                  type="date"
                  value={lastUpdated}
                  readOnly
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 bg-slate-50 cursor-default"
                />
              </div>
            </div>

          </div>
        </div>
      </form>
    </>
  );
}
