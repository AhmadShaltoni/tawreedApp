import { API_ENDPOINTS } from "@/src/constants/api";
import type { Brand, BrandsResponse } from "@/src/types";
import apiClient from "./api";

export const brandService = {
  getBrands: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get<BrandsResponse>(
      API_ENDPOINTS.BRANDS.LIST,
    );
    return data.brands;
  },
};
