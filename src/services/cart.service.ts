import { API_ENDPOINTS } from "@/src/constants/api";
import type {
  AddToCartPayload,
  AddToCartResponse,
  ApiProduct,
  CartAPIResponse,
  CartItemAPI,
  UpdateCartPayload,
} from "@/src/types";
import apiClient from "./api";
import { mapProduct } from "./product.service";

function mapRawCartItem(raw: any): CartItemAPI {
  // New API format: selectedVariant, selectedOption, selectedUnit, pricing
  if (raw.selectedVariant || raw.pricing) {
    const rawProduct = raw.product ?? {};
    const apiProduct: ApiProduct = {
      id: rawProduct.id ?? "",
      name: rawProduct.name ?? "",
      description: rawProduct.description ?? "",
      categoryId: rawProduct.categoryId ?? "",
      isActive: true,
      sortOrder: 0,
      createdAt: rawProduct.createdAt ?? "",
      updatedAt: rawProduct.updatedAt ?? "",
      image: rawProduct.image ?? null,
      images: rawProduct.images ?? (rawProduct.image ? [rawProduct.image] : []),
    };

    const sv = raw.selectedVariant;
    const so = raw.selectedOption;
    const su = raw.selectedUnit;
    const pricing = raw.pricing;

    return {
      id: raw.id,
      variantId: sv?.id ?? "",
      variant: {
        id: sv?.id ?? "",
        size: sv?.size ?? "",
        sizeEn: sv?.sizeEn ?? null,
        stock: sv?.stock ?? 999999,
        minOrderQuantity: sv?.minOrderQuantity ?? 1,
        isDefault: true,
        product: apiProduct,
        units: su
          ? [
              {
                id: su.id,
                unit: su.unit ?? su.label ?? "",
                label: su.label ?? "",
                labelEn: su.labelEn ?? su.label ?? "",
                piecesPerUnit: su.piecesPerUnit ?? 1,
                price: su.price ?? pricing?.pricePerUnit ?? 0,
                compareAtPrice: su.compareAtPrice ?? null,
                isDefault: true,
                sortOrder: 0,
              },
            ]
          : [],
        options: so
          ? [
              {
                id: so.id,
                name: so.name ?? "",
                nameEn: so.nameEn,
                stock: so.stock ?? 999999,
                priceOverride: so.priceOverride ?? null,
                isActive: true,
                sortOrder: 0,
              },
            ]
          : [],
      },
      variantOptionId: so?.id ?? null,
      variantOption: so
        ? {
            id: so.id,
            name: so.name ?? "",
            nameEn: so.nameEn,
            stock: so.stock ?? 999999,
            priceOverride: so.priceOverride ?? null,
          }
        : null,
      productUnitId: su?.id ?? null,
      productUnit: su
        ? {
            id: su.id,
            unit: su.unit ?? su.label ?? "",
            label: su.label ?? "",
            labelEn: su.labelEn ?? su.label ?? "",
            piecesPerUnit: su.piecesPerUnit ?? 1,
            price: su.price ?? pricing?.pricePerUnit ?? 0,
            compareAtPrice: su.compareAtPrice ?? null,
            isDefault: true,
            sortOrder: 0,
          }
        : null,
      quantity: raw.quantity ?? 0,
      note: raw.note ?? undefined,
      product: mapProduct(apiProduct),
    };
  }

  // Legacy API: variant contains nested product
  if (raw.variant) {
    return {
      id: raw.id,
      variantId: raw.variantId ?? raw.variant.id,
      variant: {
        ...raw.variant,
        product: raw.variant.product,
        units: raw.variant.units ?? [],
        options: raw.variant.options ?? [],
      },
      variantOptionId: raw.variantOptionId ?? null,
      variantOption: raw.variantOption ?? null,
      productUnitId: raw.productUnitId ?? null,
      productUnit: raw.productUnit ?? null,
      quantity: raw.quantity,
      note: raw.note ?? undefined,
      // Backward compat: map product for existing consumers
      product: mapProduct(raw.variant.product),
    };
  }
  // Fallback: old API shape (productId + product)
  const product = mapProduct(raw.product);
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
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
      options: defaultVariant?.options ?? [],
    },
    variantOptionId: raw.variantOptionId ?? null,
    variantOption: raw.variantOption ?? null,
    productUnitId: raw.productUnitId ?? null,
    productUnit: raw.productUnit ?? null,
    quantity: raw.quantity,
    note: raw.note ?? undefined,
    product,
  };
}

export const cartService = {
  getCart: async (): Promise<CartItemAPI[]> => {
    const { data } = await apiClient.get<CartAPIResponse>(
      API_ENDPOINTS.CART.LIST,
    );
    console.log("Cart Response:", data);
    return data.items.map(mapRawCartItem);
  },

  addToCart: async (payload: AddToCartPayload): Promise<CartItemAPI> => {
    const { data } = await apiClient.post<AddToCartResponse>(
      API_ENDPOINTS.CART.ADD,
      payload,
    );
    return mapRawCartItem(data.item ?? data);
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
