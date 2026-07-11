import type {
  Product,
  Category,
  BrandSupplier,
  StrapiListResponse,
  StrapiSingleResponse,
  ProductFormData,
} from "./types";

const BASE_URL = "http://localhost:1337/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  // DELETE (and some other) endpoints return 204 No Content — no body to parse
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as unknown as T;
  }
  return res.json() as Promise<T>;
}

// ── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const res = await apiFetch<StrapiListResponse<Product>>(
    "/products?populate=*&pagination[pageSize]=200"
  );
  return res.data;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await apiFetch<StrapiSingleResponse<Product>>(
    `/products/${id}?populate=*`
  );
  return res.data;
}

export async function createProduct(
  data: ProductFormData
): Promise<Product> {
  const res = await apiFetch<StrapiSingleResponse<Product>>("/products", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  return res.data;
}

export async function updateProduct(
  id: string,
  data: ProductFormData
): Promise<Product> {
  const res = await apiFetch<StrapiSingleResponse<Product>>(
    `/products/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ data }),
    }
  );
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/${id}`, { method: "DELETE" });
}

export async function uploadProductImage(
  numericId: number,
  file: File
): Promise<void> {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("ref", "api::product.product");
  formData.append("refId", String(numericId)); // must be numeric id, not documentId
  formData.append("field", "picture");

  const res = await fetch(`http://localhost:1337/api/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Upload error ${res.status}`);
  }
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const res = await apiFetch<StrapiListResponse<Category>>(
    "/categories?populate=*&pagination[pageSize]=200"
  );
  return res.data;
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  parent_category?: number | null;
}): Promise<Category> {
  const res = await apiFetch<StrapiSingleResponse<Category>>("/categories", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/categories/${id}`, { method: "DELETE" });
}

// ── Brand / Suppliers ─────────────────────────────────────────────────────────

export async function getBrandSuppliers(): Promise<BrandSupplier[]> {
  const res = await apiFetch<StrapiListResponse<BrandSupplier>>(
    "/brand-suppliers?populate=*&pagination[pageSize]=200"
  );
  return res.data;
}

export async function createBrandSupplier(data: {
  name: string;
  contact_number?: string;
}): Promise<BrandSupplier> {
  const res = await apiFetch<StrapiSingleResponse<BrandSupplier>>(
    "/brand-suppliers",
    {
      method: "POST",
      body: JSON.stringify({ data }),
    }
  );
  return res.data;
}

export async function updateBrandSupplier(
  id: string,
  data: { name: string; contact_number?: string }
): Promise<BrandSupplier> {
  const res = await apiFetch<StrapiSingleResponse<BrandSupplier>>(
    `/brand-suppliers/${id}`,
    {
      method: "PUT",
      body: JSON.stringify({ data }),
    }
  );
  return res.data;
}

export async function deleteBrandSupplier(id: string): Promise<void> {
  await apiFetch(`/brand-suppliers/${id}`, { method: "DELETE" });
}
