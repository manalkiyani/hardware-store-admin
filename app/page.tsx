import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";
import { getProducts, getCategories, getBrandSuppliers } from "@/lib/api";
import type { Product, Category, BrandSupplier } from "@/lib/types";
import Screener from "@/components/screener";

async function fetchData() {
  try {
    const [products, categories, suppliers] = await Promise.all([
      getProducts(),
      getCategories(),
      getBrandSuppliers(),
    ]);
    return { products, categories, suppliers, error: null };
  } catch (err) {
    return {
      products: [] as Product[],
      categories: [] as Category[],
      suppliers: [] as BrandSupplier[],
      error: err instanceof Error ? err.message : "Failed to load data",
    };
  }
}

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; supplier?: string }>;
}) {
  const { products, categories, suppliers, error } = await fetchData();
  const params = await searchParams;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-950 text-white text-sm font-medium rounded-lg hover:bg-teal-800 transition-colors"
        >
          <Plus size={15} />
          Add Product
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6">
          <AlertCircle size={15} />
          {error} — make sure Strapi is running at localhost:1337
        </div>
      )}

      <Screener
        products={products}
        categories={categories}
        suppliers={suppliers}
        initialSearch={params.q ?? ""}
        initialCategoryId={params.category ?? ""}
        initialSupplierId={params.supplier ?? ""}
      />
    </div>
  );
}
