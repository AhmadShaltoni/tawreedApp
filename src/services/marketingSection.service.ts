import { API_ENDPOINTS } from "@/src/constants/api";
import type { MarketingSection } from "@/src/types";
import apiClient from "./api";
import { mapProduct } from "./product.service";

interface BackendSection {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  description?: string | null;
  descriptionEn?: string | null;
  image?: string | null;
  showOnHome: boolean;
  sortOrder: number;
  _count?: { products: number };
  products?: any[];
}

interface SectionsListResponse {
  success: boolean;
  data: {
    sections: BackendSection[];
  };
}

interface SectionDetailResponse {
  success: boolean;
  data: {
    section: BackendSection;
  };
}

function mapSection(raw: BackendSection): MarketingSection {
  return {
    id: raw.id,
    name: raw.name,
    nameEn: raw.nameEn ?? null,
    slug: raw.slug,
    description: raw.description ?? null,
    descriptionEn: raw.descriptionEn ?? null,
    image: raw.image ?? null,
    showOnHome: raw.showOnHome,
    sortOrder: raw.sortOrder,
    productCount: raw._count?.products ?? 0,
    products: raw.products?.map(mapProduct),
  };
}

export const marketingSectionService = {
  getHomeSections: async (): Promise<MarketingSection[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.MARKETING_SECTIONS.LIST,
      { params: { showOnHome: true } },
    );

    console.log("API RESPONSE", response);

    return response.data.sections.map(mapSection);
  },

  getSectionBySlug: async (slug: string): Promise<MarketingSection> => {
    const response = await apiClient.get(
      API_ENDPOINTS.MARKETING_SECTIONS.DETAIL(slug),
    );

    return mapSection(response.data.section);
  },
};
