import { API_ENDPOINTS } from "@/src/constants/api";
import type { DeliveryFeeResponse, DeliveryZone } from "@/src/types";
import apiClient from "./api";

export const deliveryService = {
  getZones: async (): Promise<DeliveryZone[]> => {
    const { data } = await apiClient.get<{ zones: DeliveryZone[] }>(
      API_ENDPOINTS.DELIVERY.ZONES,
    );
    return data.zones;
  },

  getFee: async (
    cityId: string,
    orderTotal: number,
  ): Promise<DeliveryFeeResponse> => {
    const { data } = await apiClient.get<DeliveryFeeResponse>(
      API_ENDPOINTS.DELIVERY.FEE,
      { params: { cityId, orderTotal } },
    );
    return data;
  },
};
