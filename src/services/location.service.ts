import { API_ENDPOINTS } from "@/src/constants/api";
import type {
  City,
  UpdateLocationPayload,
  UpdateLocationResponse,
} from "@/src/types";
import apiClient from "./api";

export const locationService = {
  getCities: async (): Promise<City[]> => {
    const { data } = await apiClient.get<City[]>(
      API_ENDPOINTS.LOCATIONS.CITIES,
    );
    return data;
  },

  updateLocation: async (
    payload: UpdateLocationPayload,
  ): Promise<UpdateLocationResponse> => {
    const { data } = await apiClient.patch<UpdateLocationResponse>(
      API_ENDPOINTS.USER.UPDATE_LOCATION,
      payload,
    );
    return data;
  },
};
