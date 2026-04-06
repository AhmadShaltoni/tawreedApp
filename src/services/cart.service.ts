import { API_ENDPOINTS } from "@/src/constants/api";
import type {
    AddToCartPayload,
    CartItemAPI,
    UpdateCartPayload,
} from "@/src/types";
import apiClient from "./api";

export const cartService = {
  getCart: async (): Promise<CartItemAPI[]> => {
    const { data } = await apiClient.get<CartItemAPI[]>(
      API_ENDPOINTS.CART.LIST,
    );
    return data;
  },

  addToCart: async (payload: AddToCartPayload): Promise<CartItemAPI> => {
    const { data } = await apiClient.post<CartItemAPI>(
      API_ENDPOINTS.CART.ADD,
      payload,
    );
    return data;
  },

  updateCartItem: async (
    id: string,
    payload: UpdateCartPayload,
  ): Promise<CartItemAPI> => {
    const { data } = await apiClient.patch<CartItemAPI>(
      API_ENDPOINTS.CART.UPDATE(id),
      payload,
    );
    return data;
  },

  removeCartItem: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CART.REMOVE(id));
  },
};
