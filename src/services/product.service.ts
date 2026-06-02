import { API_BASE_URL, API_ENDPOINTS } from "@/src/constants/api";
import type {
    ApiProduct,
    ApiProductsResponse,
    Product,
    ProductFilters,
    ProductsResponse,
    ProductUnit,
    ProductVariant,
    VariantOption,
} from "@/src/types";
import apiClient from "./api";

function buildImageUrl(img: string): string {
  return img.startsWith("http") ? img : `${API_BASE_URL}${img}`;
}

function mapUnit(u: ProductUnit): ProductUnit {
  return {
    id: u.id,
    unit: u.unit,
    label: u.label,
    labelEn: u.labelEn,
    piecesPerUnit: u.piecesPerUnit,
    price: u.price,
    compareAtPrice: u.compareAtPrice ?? null,
    isDefault: u.isDefault,
    sortOrder: u.sortOrder,
  };
}

function mapOption(o: any): VariantOption {
  return {
    id: o.id,
    name: o.name,
    nameEn: o.nameEn ?? null,
    image: o.image ?? null,
    stock: o.stock ?? 0,
    sku: o.sku ?? null,
    barcode: o.barcode ?? null,
    priceOverride: o.priceOverride ?? null,
    isActive: o.isActive !== false,
    sortOrder: o.sortOrder ?? 0,
  };
}

/** Map a raw API product to the app's Product type */
export function mapProduct(raw: ApiProduct): Product {
  // Build full image URLs
  const images: string[] = [];
  if (raw.image) {
    images.push(buildImageUrl(raw.image));
  }
  for (const img of raw.images ?? []) {
    if (img) {
      images.push(buildImageUrl(img));
    }
  }

  // Map variants (new API structure)
  const variants: ProductVariant[] = (raw.variants ?? []).map((v) => ({
    id: v.id,
    size: v.size,
    sizeEn: v.sizeEn ?? null,
    image: v.image ?? null,
    sku: v.sku ?? null,
    barcode: v.barcode ?? null,
    stock: v.stock,
    minOrderQuantity: v.minOrderQuantity,
    isDefault: v.isDefault,
    isActive: v.isActive,
    sortOrder: v.sortOrder,
    units: (v.units ?? []).map(mapUnit),
    options: (v.options ?? []).map(mapOption),
  }));

  // If API still sends flat structure (no variants), create a single variant for backward compat
  if (variants.length === 0 && raw.price != null) {
    const fallbackUnits: ProductUnit[] = raw.units
      ? raw.units.map(mapUnit)
      : [];
    variants.push({
      id: `${raw.id}_default`,
      size: "",
      sizeEn: null,
      sku: raw.sku ?? null,
      barcode: raw.barcode ?? null,
      stock: raw.stock ?? 0,
      minOrderQuantity: raw.minOrderQuantity ?? 1,
      isDefault: true,
      isActive: true,
      sortOrder: 0,
      units: fallbackUnits,
      options: [],
    });
  }

  // Derive convenience fields from default variant
  const defaultVariant =
    variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  const defaultUnit =
    defaultVariant?.units.find((u) => u.isDefault) ??
    defaultVariant?.units[0] ??
    null;

  const price = defaultUnit
    ? defaultUnit.compareAtPrice != null &&
      defaultUnit.compareAtPrice > defaultUnit.price
      ? defaultUnit.compareAtPrice
      : defaultUnit.price
    : (raw.price ?? 0);
  const discountPrice = defaultUnit
    ? defaultUnit.compareAtPrice != null &&
      defaultUnit.compareAtPrice > defaultUnit.price
      ? defaultUnit.price
      : undefined
    : raw.compareAtPrice != null && raw.compareAtPrice > (raw.price ?? 0)
      ? raw.price
      : undefined;

  return {
    id: raw.id,
    name: raw.name,
    nameAr: raw.name,
    description: raw.description ?? "",
    descriptionAr: raw.description ?? "",
    images,
    categoryId: raw.categoryId,
    categoryName: raw.category?.name,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    variants,
    // Convenience fields from default variant
    price,
    discountPrice,
    sku: defaultVariant?.sku ?? raw.sku ?? "",
    stock: defaultVariant?.stock ?? raw.stock ?? 0,
    minOrder: defaultVariant?.minOrderQuantity ?? raw.minOrderQuantity ?? 1,
    unit: raw.unit ?? defaultUnit?.unit ?? "",
    featured: false,
    // Deprecated: flatten units from default variant for backward compat
    units: defaultVariant?.units,
  };
}

export const productService = {
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
    if (filters?.brandId) params.brandId = filters.brandId;
    if (filters?.tag) params.tag = filters.tag;
    if (filters?.includeDescendants) params.includeDescendants = true;
    if (filters?.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters?.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    if (filters?.featured !== undefined) params.featured = filters.featured;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.sort) params.sort = filters.sort;

    const { data } = await apiClient.get<ApiProductsResponse>(
      API_ENDPOINTS.PRODUCTS.LIST,
      { params },
    );
    return {
      products: data.products.map(mapProduct),
      total: data.pagination.total,
      page: data.pagination.page,
      limit: data.pagination.limit,
    };
  },

  getProduct: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<{ product: ApiProduct }>(
      API_ENDPOINTS.PRODUCTS.DETAIL(id),
    );
    return mapProduct(data.product);
  },

  getFeatured: async (): Promise<ProductsResponse> => {
    const { data } = await apiClient.get<ApiProductsResponse>(
      API_ENDPOINTS.PRODUCTS.FEATURED,
    );
    return {
      products: data.products.map(mapProduct),
      total: data.pagination.total,
      page: data.pagination.page,
      limit: data.pagination.limit,
    };
  },
};
