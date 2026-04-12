import { API_BASE_URL, API_ENDPOINTS } from "@/src/constants/api";
import type {
  ApiProduct,
  ApiProductsResponse,
  Product,
  ProductFilters,
  ProductsResponse,
  ProductUnit,
} from "@/src/types";
import apiClient from "./api";

/** Map a raw API product to the app's Product type */
export function mapProduct(raw: ApiProduct): Product {
  const hasComparePrice =
    raw.compareAtPrice != null && raw.compareAtPrice > raw.price;

  // Build full image URLs
  const images: string[] = [];
  if (raw.image) {
    const imageUrl = raw.image.startsWith("http")
      ? raw.image
      : `${API_BASE_URL}${raw.image}`;
    images.push(imageUrl);
  }
  for (const img of raw.images ?? []) {
    if (img) {
      images.push(img.startsWith("http") ? img : `${API_BASE_URL}${img}`);
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    nameAr: raw.name,
    description: raw.description,
    descriptionAr: raw.description,
    price: hasComparePrice ? raw.compareAtPrice! : raw.price,
    discountPrice: hasComparePrice ? raw.price : undefined,
    sku: raw.sku ?? "",
    images,
    categoryId: raw.categoryId,
    categoryName: raw.category?.name,
    unit: raw.unit,
    minOrder: raw.minOrderQuantity ?? 1,
    stock: raw.stock,
    featured: false,
    createdAt: raw.createdAt,
    units: raw.units?.map(
      (u): ProductUnit => ({
        id: u.id,
        unit: u.unit,
        label: u.label,
        labelEn: u.labelEn,
        piecesPerUnit: u.piecesPerUnit,
        price: u.price,
        compareAtPrice: u.compareAtPrice ?? null,
        isDefault: u.isDefault,
        sortOrder: u.sortOrder,
      }),
    ),
  };
}

export const productService = {
  getProducts: async (filters?: ProductFilters): Promise<ProductsResponse> => {
    const params: Record<string, string | number | boolean> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.categoryId) params.categoryId = filters.categoryId;
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
