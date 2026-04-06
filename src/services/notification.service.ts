import { API_ENDPOINTS } from "@/src/constants/api";
import type { Notification } from "@/src/types";
import apiClient from "./api";

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.notifications)) return data.notifications;
    return [];
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  },
};
