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
export type VariantType = "none" | "weight" | "size";

export interface SizeEntry {
  id?: number;
  value: number;
  unit: SizeUnit;
  purchase_price?: number | null;
  sale_price?: number | null;
  in_stock?: number | null;
}

export interface WeightVariant {
  id?: number;
  weight: WeightUnit;
  purchase_price?: number | null;
  sale_price?: number | null;
  in_stock?: number | null;
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
  variant_type?: VariantType;
  sizes?: SizeEntry[];
  weight_variants?: WeightVariant[];
  colors?: ColorEntry[];
  material?: string;
  purchase_price?: number | null;
  sale_price?: number | null;
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
  variant_type: VariantType;
  purchase_price?: number | string | null;
  sale_price?: number | string | null;
  weight_variants?: { weight: WeightUnit; purchase_price?: number | null; sale_price?: number | null }[];
  in_stock?: number | string;
  shelf_location?: string;
  last_updated?: string;
  sizes?: { value: number; unit: SizeUnit; purchase_price?: number | null; sale_price?: number | null }[];
  colors?: { value: string }[];
  category?: number | null;
  brand_supplier?: number | null;
}
