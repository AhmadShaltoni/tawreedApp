import { API_ENDPOINTS } from "@/src/constants/api";
import type {
    CreateOrderPayload,
    EditOrderPayload,
    Order,
    OrderDetail,
} from "@/src/types";
import apiClient from "./api";

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<{ orders: Order[] }>(
      API_ENDPOINTS.ORDERS.LIST,
    );
    return data.orders;
  },

  getRecentOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<{ orders: Order[] }>(
      API_ENDPOINTS.ORDERS.RECENT,
    );
    return data.orders;
  },

  getOrderDetail: async (id: string): Promise<OrderDetail> => {
    const { data } = await apiClient.get<OrderDetail>(
      API_ENDPOINTS.ORDERS.DETAIL(id),
    );
    return data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<OrderDetail> => {
    const { data } = await apiClient.post<OrderDetail>(
      API_ENDPOINTS.ORDERS.CREATE,
      payload,
    );
    return data;
  },

  updateOrder: async (
    id: string,
    payload: EditOrderPayload,
  ): Promise<OrderDetail> => {
    const { data } = await apiClient.patch<OrderDetail>(
      API_ENDPOINTS.ORDERS.UPDATE(id),
      payload,
    );
    return data;
  },
};
