import { API_BASE_URL, API_ENDPOINTS } from "@/src/constants/api";
import type { OrderStatus } from "@/src/types";
import apiClient from "./api";

/* ------------------------------------------------------------------ */
/* Types — mirror the /api/v1/admin/orders DTOs                        */
/* ------------------------------------------------------------------ */

export interface AdminOrderBuyer {
  id: string;
  username: string;
  storeName: string | null;
  phone: string | null;
  city?: string | null;
  email?: string | null;
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryFee: number;
  createdAt: string;
  itemCount: number;
  pendingEditCount: number;
  buyer: AdminOrderBuyer;
  items: {
    id: string;
    productName: string;
    productImage: string | null;
    quantity: number;
    totalPrice: number;
    isReward: boolean;
  }[];
}

export interface AdminOrdersResponse {
  orders: AdminOrderListItem[];
  total: number;
  pages: number;
  page: number;
  statusCounts: Record<string, number>;
}

export interface AdminOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  productNameEn: string | null;
  productImage: string | null;
  variantSize: string | null;
  variantSizeEn: string | null;
  variantOptionName: string | null;
  variantOptionNameEn: string | null;
  unitLabel: string | null;
  unitLabelEn: string | null;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  note: string | null;
  isReward: boolean;
}

/** One line of the buyer's proposed edit (before/after shapes). */
export interface EditDiffLine {
  productName: string;
  productNameEn: string | null;
  productImage: string | null;
  variantSize: string | null;
  variantOptionName: string | null;
  unitLabel: string | null;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface OrderEditDiff {
  added: EditDiffLine[];
  removed: EditDiffLine[];
  changed: { before: EditDiffLine; after: EditDiffLine; quantityDelta: number }[];
  unchanged: EditDiffLine[];
  delivery: {
    address?: { before: string | null; after: string | null };
    addressDetails?: { before: string | null; after: string | null };
    city?: { before: string | null; after: string | null };
    notes?: { before: string | null; after: string | null };
  };
  totals: {
    before: { productsTotal: number; deliveryFee: number; grandTotal: number };
    after: { productsTotal: number; deliveryFee: number; grandTotal: number };
  };
}

export interface AdminPendingEditRequest {
  id: string;
  status: string;
  diff: OrderEditDiff | null;
  estimatedTotal: number | null;
  estimatedDeliveryFee: number | null;
  buyerMessage: string | null;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  statusHistory: { status: string; timestamp: string; note?: string | null }[];
  totalPrice: number;
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
  deliveryCity: string;
  deliveryAddress: string;
  deliveryAddressDetails: string | null;
  buyerNotes: string | null;
  buyer: AdminOrderBuyer;
  items: AdminOrderItem[];
  pendingEditRequest: AdminPendingEditRequest | null;
}

export interface AdminOrderDetailResponse {
  order: AdminOrderDetail;
  whatsappMessage: string;
}

/* ------------------------------------------------------------------ */

/** Build full image URL from a relative path (e.g. /uploads/products/x.webp) */
function fullImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

export const adminOrderService = {
  getOrders: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminOrdersResponse> => {
    const { data } = await apiClient.get<AdminOrdersResponse>(
      API_ENDPOINTS.ADMIN.ORDERS,
      { params },
    );
    return {
      ...data,
      orders: data.orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          productImage: fullImageUrl(item.productImage),
        })),
      })),
    };
  },

  getOrderDetail: async (
    id: string,
    lang: "ar" | "en" = "ar",
  ): Promise<AdminOrderDetailResponse> => {
    const { data } = await apiClient.get<AdminOrderDetailResponse>(
      API_ENDPOINTS.ADMIN.ORDER_DETAIL(id),
      { params: { lang } },
    );
    return {
      ...data,
      order: {
        ...data.order,
        items: data.order.items.map((item) => ({
          ...item,
          productImage: fullImageUrl(item.productImage),
        })),
      },
    };
  },

  updateOrderStatus: async (
    id: string,
    status: OrderStatus,
    note?: string,
  ): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.ADMIN.ORDER_STATUS(id), {
      status,
      ...(note?.trim() ? { note: note.trim() } : {}),
    });
  },

  resolveEditRequest: async (
    editRequestId: string,
    action: "approve" | "reject",
    adminNote?: string,
  ): Promise<void> => {
    await apiClient.post(
      API_ENDPOINTS.ADMIN.EDIT_REQUEST_RESOLVE(editRequestId),
      {
        action,
        ...(adminNote?.trim() ? { adminNote: adminNote.trim() } : {}),
      },
    );
  },
};
