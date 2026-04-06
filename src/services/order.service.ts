import { API_ENDPOINTS } from "@/src/constants/api";
import type { CreateOrderPayload, Order, OrderDetail } from "@/src/types";
import apiClient from "./api";

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>(API_ENDPOINTS.ORDERS.LIST);
    return data;
  },

  getRecentOrders: async (): Promise<Order[]> => {
    const { data } = await apiClient.get<Order[]>(API_ENDPOINTS.ORDERS.RECENT);
    return data;
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
};
