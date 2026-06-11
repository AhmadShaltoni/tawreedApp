import { API_BASE_URL, API_ENDPOINTS } from "@/src/constants/api";
import type {
    CartValidationResponse,
    CreateOrderPayload,
    EditOrderPayload,
    Order,
    OrderDetail,
    OrderItem,
} from "@/src/types";
import apiClient from "./api";

/* ------------------------------------------------------------------ */
/* Mapping helpers — translate backend field names to frontend types   */
/* ------------------------------------------------------------------ */

/** Build full image URL from a relative path (e.g. /uploads/products/xxx.webp) */
function fullImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

/** Map a single order item from backend shape to frontend OrderItem */
function mapItem(raw: any): OrderItem {
  // Get pricing from the correct structure: raw.pricing.pricePerUnit
  const price =
    raw.pricing?.pricePerUnit ??
    raw.pricePerUnit ??
    raw.unitPrice ??
    raw.itemPrice ??
    raw.price ??
    raw.product?.price ??
    0;

  // Get subtotal from the correct structure: raw.pricing.subtotal
  const subtotal =
    (raw.pricing?.subtotal ??
      raw.totalPrice ??
      raw.subtotal ??
      raw.lineTotal ??
      raw.itemTotal) ||
    price * (raw.quantity ?? 0) ||
    0;

  // Get product info from raw.product object
  const productName = raw.product?.name ?? raw.productName ?? "";
  const productId = raw.product?.id ?? raw.productId ?? "";
  const productImage = fullImageUrl(raw.product?.image ?? raw.productImage);

  return {
    id: raw.id,
    productId,
    productName,
    productImage,
    variantSize: raw.variantSize ?? raw.variant?.size,
    variantSizeEn: raw.variantSizeEn ?? raw.variant?.sizeEn,
    price,
    quantity: raw.quantity ?? 0,
    unit: raw.unit?.unit ?? raw.unit ?? raw.product?.unit ?? "",
    subtotal,
    unitLabel: raw.unitLabel ?? raw.unit?.label,
    unitLabelEn:
      raw.unitLabelEn ?? raw.unit?.labelEn ?? raw.product?.unitLabelEn,
    piecesPerUnit: raw.piecesPerUnit ?? raw.unit?.piecesPerUnit,
    optionName: raw.optionName ?? raw.variantOption?.name,
    optionNameEn: raw.optionNameEn ?? raw.variantOption?.nameEn,
    note: raw.note ?? raw.itemNote,
  };
}

/** Map a raw order from the API to the frontend Order shape */
function mapOrder(raw: any): Order {
  const items = raw.items?.map(mapItem);
  return {
    id: raw.id,
    orderNumber: raw.orderNumber ?? raw.id,
    status: raw.status,
    total: raw.totalPrice ?? raw.total ?? 0,
    itemCount: raw.itemCount ?? items?.length ?? 0,
    createdAt: raw.createdAt,
    buyerNotes: raw.buyerNotes,
    statusHistory: raw.statusHistory,
    items,
  };
}

/** Map a single order detail (extends Order with shipping info) */
function mapOrderDetail(raw: any): OrderDetail {
  const base = mapOrder(raw);
  return {
    ...base,
    items: base.items ?? [],
    shippingAddress: raw.deliveryAddress ?? raw.shippingAddress ?? "",
    city: raw.deliveryCity ?? raw.city ?? "",
    notes: raw.buyerNotes ?? raw.notes,
    updatedAt: raw.updatedAt ?? raw.createdAt,
    statusHistory: raw.statusHistory,
    // Delivery fee data from backend
    subtotal: raw.subtotal ?? raw.productsTotal,
    deliveryFee: raw.deliveryFee ?? raw.shippingFee,
    isFreeDelivery: raw.isFreeDelivery ?? raw.deliveryFee === 0,
    discountAmount: raw.discountAmount ?? raw.discount,
    couponCode: raw.couponCode,
  };
}

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<{ orders: any[] }>(
      API_ENDPOINTS.ORDERS.LIST,
    );
    return data.orders.map(mapOrder);
  },

  getRecentOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<{ orders: any[] }>(
      API_ENDPOINTS.ORDERS.RECENT,
    );
    return data.orders.map(mapOrder);
  },

  getOrderDetail: async (id: string): Promise<OrderDetail> => {
    const { data } = await apiClient.get<any>(API_ENDPOINTS.ORDERS.DETAIL(id));
    // API may wrap in { order: {...} } or return object directly
    const raw = data.order ?? data;
    return mapOrderDetail(raw);
  },

  createOrder: async (payload: CreateOrderPayload): Promise<OrderDetail> => {
    console.log("🌐 API: POST /api/v1/orders with payload:", payload);
    try {
      const { data } = await apiClient.post<any>(
        API_ENDPOINTS.ORDERS.CREATE,
        payload,
      );
      console.log("🌐 API: Response received:", data);
      return mapOrderDetail(data);
    } catch (error: any) {
      console.error(
        "🌐 API: POST error:",
        error.response?.status,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  updateOrder: async (
    id: string,
    payload: EditOrderPayload,
  ): Promise<OrderDetail> => {
    const { data } = await apiClient.patch<any>(
      API_ENDPOINTS.ORDERS.UPDATE(id),
      payload,
    );
    return mapOrderDetail(data);
  },

  validateCart: async (): Promise<CartValidationResponse> => {
    console.log(`🌐 API: GET ${API_ENDPOINTS.CART.VALIDATE}`);
    try {
      const { data } = await apiClient.get<CartValidationResponse>(
        API_ENDPOINTS.CART.VALIDATE,
      );
      console.log("🌐 API: Cart validation response:", data);
      return data;
    } catch (error: any) {
      const status = error.response?.status;
      console.error(
        "🌐 API: Cart validation error:",
        status,
        error.response?.data || error.message,
      );

      // If backend doesn't support pre-checkout validation yet, do not block
      // order creation. The create-order endpoint should remain authoritative.
      if (status === 404 || status === 405) {
        return { valid: true };
      }
      throw error;
    }
  },
};
