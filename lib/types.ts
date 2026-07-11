export interface StrapiImage {
  id: number;
  url: string;
  name: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
  };
}

export type SizeUnit = "foot" | "inch" | "meter";
export type WeightUnit = "Dabbi" | "Quarter" | "Gallon" | "Bucket";

export interface SizeEntry {
  id?: number;
  value: number;
  unit: SizeUnit;
}

export interface ColorEntry {
  id?: number;
  value: string;
}

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  parent_category?: Category | null;
  sub_categories?: Category[];
  products?: Product[];
}

export interface BrandSupplier {
  id: number;
  documentId: string;
  name: string;
  contact_number?: string;
  products?: Product[];
}

export interface Product {
  id: number;
  documentId: string;
  name: string;
  slug?: string;
  description?: string;
  picture?: StrapiImage | null;
  code?: string;
  sizes?: SizeEntry[];
  colors?: ColorEntry[];
  material?: string;
  purchase_price?: number;
  sale_price: number;
  weight?: WeightUnit | null;
  in_stock?: number;
  shelf_location?: string;
  last_updated?: string;
  category?: Category | null;
  brand_supplier?: BrandSupplier | null;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface ProductFormData {
  name: string;
  slug?: string;
  description?: string;
  code?: string;
  material?: string;
  purchase_price?: number | string;
  sale_price: number | string;
  weight?: WeightUnit | null;
  in_stock?: number | string;
  shelf_location?: string;
  last_updated?: string;
  sizes?: { value: number; unit: SizeUnit }[];
  colors?: { value: string }[];
  category?: number | null;
  brand_supplier?: number | null;
}
