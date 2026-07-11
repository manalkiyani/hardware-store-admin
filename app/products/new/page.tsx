import { getCategories, getBrandSuppliers } from "@/lib/api";
import ProductForm from "@/components/product-form";
import { AlertCircle } from "lucide-react";
import type { Category, BrandSupplier } from "@/lib/types";

async function fetchFormData() {
  try {
    const [categories, suppliers] = await Promise.all([
      getCategories(),
      getBrandSuppliers(),
    ]);
    return { categories, suppliers, error: null };
  } catch (err) {
    return {
      categories: [] as Category[],
      suppliers: [] as BrandSupplier[],
      error: err instanceof Error ? err.message : "Failed to load form data",
    };
  }
}

export default async function NewProductPage() {
  const { categories, suppliers, error } = await fetchFormData();

  return (
    <div>
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6">
          <AlertCircle size={15} />
          {error}
        </div>
      )}
      <ProductForm categories={categories} suppliers={suppliers} />
    </div>
  );
}
