import { API_ENDPOINTS } from "@/src/constants/api";
import type { Notice } from "@/src/types";
import apiClient from "./api";

const DEFAULT_BACKGROUND_COLOR = "#FFA500";
const DEFAULT_TEXT_COLOR = "#FFFFFF";

// Raw response from backend
interface BackendNoticeData {
  id: string;
  text: string;
  backgroundColor?: string;
  textColor?: string;
}

interface BackendNoticesResponse {
  success: boolean;
  data: BackendNoticeData[];
}

/** Map a raw API notice to the app's Notice type */
function mapNotice(raw: BackendNoticeData): Notice {
  return {
    id: raw.id,
    text: raw.text,
    backgroundColor: raw.backgroundColor ?? DEFAULT_BACKGROUND_COLOR,
    textColor: raw.textColor ?? DEFAULT_TEXT_COLOR,
    isActive: true, // Backend doesn't send this, assume all are active
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const noticeService = {
  getNotices: async (): Promise<Notice[]> => {
    const { data } = await apiClient.get<BackendNoticesResponse>(
      API_ENDPOINTS.NOTICES.LIST,
    );
    return data.data.map(mapNotice);
  },
};
