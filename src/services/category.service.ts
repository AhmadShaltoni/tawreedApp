import { API_BASE_URL, API_ENDPOINTS } from "@/src/constants/api";
import type { Category } from "@/src/types";
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
  image?: CategoryImageData | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

interface ApiCategoriesResponse {
  categories: ApiCategory[];
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
    nameAr: raw.name,
    image,
    productCount: raw._count?.products,
  };
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<ApiCategoriesResponse>(
      API_ENDPOINTS.CATEGORIES.LIST,
    );
    return data.categories.map(mapCategory);
  },
};
