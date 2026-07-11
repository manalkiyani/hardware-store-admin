import { getBrandSuppliers } from "@/lib/api";
import { AlertCircle } from "lucide-react";
import type { BrandSupplier } from "@/lib/types";
import SupplierManager from "./supplier-manager";

async function fetchSuppliers() {
  try {
    const suppliers = await getBrandSuppliers();
    return { suppliers, error: null };
  } catch (err) {
    return {
      suppliers: [] as BrandSupplier[],
      error: err instanceof Error ? err.message : "Failed to load suppliers",
    };
  }
}

export default async function SuppliersPage() {
  const { suppliers, error } = await fetchSuppliers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Brands & Suppliers
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <SupplierManager initialSuppliers={suppliers} />
    </div>
  );
}
