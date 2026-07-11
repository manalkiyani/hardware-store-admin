import Link from "next/link";
import Image from "next/image";
import { Plus, AlertCircle } from "lucide-react";
import { getProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import ProductActions from "./product-actions";

async function fetchProducts() {
  try {
    const products = await getProducts();
    return { products, error: null };
  } catch (err) {
    return {
      products: [] as Product[],
      error: err instanceof Error ? err.message : "Failed to load products",
    };
  }
}

export default async function ProductsPage() {
  const { products, error } = await fetchProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} total
          </p>
        </div>
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
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {products.length === 0 && !error ? (
          <div className="px-5 py-16 text-center text-sm text-slate-400">
            No products yet.{" "}
            <Link href="/products/new" className="text-slate-600 underline">
              Add your first product
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3 w-10">
                  No.
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3 w-14">
                  Image
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Sizes
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Colors
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Purchase Price
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  In Stock
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wide px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => (
                <tr
                  key={product.id}
                  className={
                    i < products.length - 1
                      ? "border-b border-slate-100 hover:bg-slate-50"
                      : "hover:bg-slate-50"
                  }
                >
                  {/* No. */}
                  <td className="px-5 py-3 text-sm text-slate-400 tabular-nums">
                    {i + 1}
                  </td>

                  {/* Image */}
                  <td className="px-5 py-3">
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
                  <td className="px-5 py-3">
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
                  <td className="px-5 py-3">
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
                  <td className="px-5 py-3">
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
                  <td className="px-5 py-3 text-sm text-slate-900 text-right font-medium">
                    {product.purchase_price != null
                      ? `Rs ${product.purchase_price.toLocaleString()}`
                      : <span className="text-slate-300 font-normal">—</span>}
                  </td>

                  {/* Qty */}
                  <td className="px-5 py-3 text-sm text-slate-500 text-right">
                    {product.in_stock ?? "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3 text-right">
                    <ProductActions
                      productId={product.documentId}
                      productName={product.name}
                    />
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
