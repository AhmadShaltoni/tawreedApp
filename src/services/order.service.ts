import { API_BASE_URL, API_ENDPOINTS } from "@/src/constants/api";
import type {
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
  return {
    id: raw.id,
    productId: raw.productId ?? "",
    productName: raw.productName ?? raw.product?.name ?? "",
    productImage: fullImageUrl(raw.productImage ?? raw.product?.image),
    price: raw.pricePerUnit ?? raw.price ?? 0,
    quantity: raw.quantity ?? 0,
    unit: raw.unit ?? "",
    subtotal: raw.totalPrice ?? raw.subtotal ?? 0,
    unitLabel: raw.unitLabel,
    unitLabelEn: raw.unitLabelEn,
    piecesPerUnit: raw.piecesPerUnit,
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
};
