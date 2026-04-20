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

function mapRawCartItem(raw: any): CartItemAPI {
  // New API: variant contains nested product
  if (raw.variant) {
    return {
      id: raw.id,
      variantId: raw.variantId ?? raw.variant.id,
      variant: {
        ...raw.variant,
        product: raw.variant.product,
        units: raw.variant.units ?? [],
      },
      productUnitId: raw.productUnitId ?? null,
      productUnit: raw.productUnit ?? null,
      quantity: raw.quantity,
      // Backward compat: map product for existing consumers
      product: mapProduct(raw.variant.product),
    };
  }
  // Fallback: old API shape (productId + product)
  const product = mapProduct(raw.product);
  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  return {
    id: raw.id,
    variantId: defaultVariant?.id ?? raw.productId,
    variant: {
      id: defaultVariant?.id ?? raw.productId,
      size: defaultVariant?.size ?? "",
      sizeEn: defaultVariant?.sizeEn ?? null,
      stock: defaultVariant?.stock ?? product.stock,
      minOrderQuantity: defaultVariant?.minOrderQuantity ?? product.minOrder,
      isDefault: true,
      product: raw.product,
      units: defaultVariant?.units ?? product.units ?? [],
    },
    productUnitId: raw.productUnitId ?? null,
    productUnit: raw.productUnit ?? null,
    quantity: raw.quantity,
    product,
  };
}

export const cartService = {
  getCart: async (): Promise<CartItemAPI[]> => {
    const { data } = await apiClient.get<CartAPIResponse>(
      API_ENDPOINTS.CART.LIST,
    );
    return data.items.map(mapRawCartItem);
  },

  addToCart: async (payload: AddToCartPayload): Promise<CartItemAPI> => {
    const { data } = await apiClient.post<AddToCartResponse>(
      API_ENDPOINTS.CART.ADD,
      payload,
    );
    return mapRawCartItem(data.item);
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
