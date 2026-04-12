import { API_ENDPOINTS } from "@/src/constants/api";
import type {
    AddToCartPayload,
    AddToCartResponse,
    CartAPIResponse,
    CartItemAPI,
    UpdateCartPayload
} from "@/src/types";
import apiClient from "./api";
import { mapProduct } from "./product.service";

export const cartService = {
  getCart: async (): Promise<CartItemAPI[]> => {
    const { data } = await apiClient.get<CartAPIResponse>(
      API_ENDPOINTS.CART.LIST,
    );
    return data.items.map((item) => ({
      ...item,
      product: mapProduct(item.product),
    }));
  },

  addToCart: async (payload: AddToCartPayload): Promise<CartItemAPI> => {
    const { data } = await apiClient.post<AddToCartResponse>(
      API_ENDPOINTS.CART.ADD,
      payload,
    );
    return {
      ...data.item,
      product: mapProduct(data.item.product),
    };
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
