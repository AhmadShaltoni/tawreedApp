import { API_BASE_URL, API_ENDPOINTS } from "@/src/constants/api";
import type { BreadcrumbItem, Category } from "@/src/types";
import apiClient from "./api";

interface CategoryImageData {
  url: string;
  alt: string;
}

interface ApiCategory {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  parentId?: string | null;
  depth?: number;
  hasChildren?: boolean;
  childrenCount?: number;
  productsCount?: number;
  image?: CategoryImageData | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
  children?: ApiCategory[];
}

interface ApiCategoriesResponse {
  categories: ApiCategory[];
  breadcrumb?: BreadcrumbItem[];
}

function mapCategory(raw: ApiCategory): Category {
  let image: { url: string; alt: string } | undefined;
  if (raw.image?.url) {
    const imageUrl = raw.image.url.startsWith("http")
      ? raw.image.url
      : `${API_BASE_URL}${raw.image.url}`;
    image = {
      url: imageUrl,
      alt: raw.image.alt || raw.name,
    };
  }

  return {
    id: raw.id,
    name: raw.name,
    nameEn: raw.nameEn,
    nameAr: raw.name,
    slug: raw.slug || "",
    parentId: raw.parentId ?? null,
    depth: raw.depth ?? 0,
    hasChildren: raw.hasChildren ?? false,
    childrenCount: raw.childrenCount ?? 0,
    productsCount: raw.productsCount ?? raw._count?.products ?? 0,
    image,
    productCount: raw.productsCount ?? raw._count?.products,
    children: raw.children?.map(mapCategory),
  };
}

export interface CategoriesResult {
  categories: Category[];
  breadcrumb: BreadcrumbItem[];
}

export const categoryService = {
  /** Fetch categories. Pass parentId to get children of a specific category. */
  getCategories: async (parentId?: string): Promise<CategoriesResult> => {
    const params: Record<string, string> = {};
    if (parentId) params.parentId = parentId;

    const { data } = await apiClient.get<ApiCategoriesResponse>(
      API_ENDPOINTS.CATEGORIES.LIST,
      { params },
    );
    return {
      categories: data.categories.map(mapCategory),
      breadcrumb: data.breadcrumb ?? [],
    };
  },
};
