import { getCategories } from "@/lib/api";
import { AlertCircle } from "lucide-react";
import type { Category } from "@/lib/types";
import CategoryManager from "./category-manager";

async function fetchCategories() {
  try {
    const categories = await getCategories();
    return { categories, error: null };
  } catch (err) {
    return {
      categories: [] as Category[],
      error: err instanceof Error ? err.message : "Failed to load categories",
    };
  }
}

export default async function CategoriesPage() {
  const { categories, error } = await fetchCategories();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">
          {categories.length} categor{categories.length !== 1 ? "ies" : "y"} total
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <CategoryManager initialCategories={categories} />
    </div>
  );
}
