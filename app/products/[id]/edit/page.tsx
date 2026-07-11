import { getProduct, getCategories, getBrandSuppliers } from "@/lib/api";
import ProductForm from "@/components/product-form";
import { AlertCircle } from "lucide-react";
import type { Category, BrandSupplier, Product } from "@/lib/types";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

async function fetchEditData(id: string) {
  try {
    const [product, categories, suppliers] = await Promise.all([
      getProduct(id),
      getCategories(),
      getBrandSuppliers(),
    ]);
    return { product, categories, suppliers, error: null };
  } catch (err) {
    return {
      product: null as Product | null,
      categories: [] as Category[],
      suppliers: [] as BrandSupplier[],
      error: err instanceof Error ? err.message : "Failed to load product",
    };
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const { product, categories, suppliers, error } = await fetchEditData(id);

  if (error || !product) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
        <AlertCircle size={15} />
        {error ?? "Product not found"}
      </div>
    );
  }

  return (
    <ProductForm product={product} categories={categories} suppliers={suppliers} />
  );
}
