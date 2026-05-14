const mockAnonymousPost = jest.fn();
const mockAuthenticatedPost = jest.fn();
const mockGetMessaging = jest.fn();
const mockGetFcmToken = jest.fn();
const mockOnTokenRefresh = jest.fn();
const mockRequestPermission = jest.fn();
const mockGetJwtToken = jest.fn();

jest.mock("@/src/constants/api", () => ({
  API_BASE_URL: "https://api.test",
  API_ENDPOINTS: {
    REGISTER_DEVICE_TOKEN: "/api/v1/notifications/device-token",
    UNREGISTER_DEVICE_TOKEN: "/api/v1/notifications/device-token",
  },
}));

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      post: mockAnonymousPost,
    })),
  },
}));

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    post: mockAuthenticatedPost,
    delete: jest.fn(),
  },
}));

jest.mock("@/src/services/tokenStorage", () => ({
  getToken: mockGetJwtToken,
}));

jest.mock("@react-native-firebase/messaging", () => ({
  AuthorizationStatus: {
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    DENIED: 0,
  },
  getMessaging: mockGetMessaging,
  getToken: mockGetFcmToken,
  onTokenRefresh: mockOnTokenRefresh,
  requestPermission: mockRequestPermission,
}));

jest.mock("expo-device", () => ({
  brand: "Apple",
  manufacturer: "Apple",
  modelName: "iPhone 15",
  osName: "iOS",
  osVersion: "17.0",
  deviceName: "Test iPhone",
  deviceType: 1,
  isDevice: true,
}));

import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { firebaseMessagingService } from "@/src/services/notifications/firebase";

describe("Firebase Messaging Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMessaging.mockReturnValue({});
    mockGetFcmToken.mockResolvedValue("fcm-token-123");
    mockRequestPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
    mockOnTokenRefresh.mockReturnValue(jest.fn());
    mockAnonymousPost.mockResolvedValue({ status: 201 });
    mockAuthenticatedPost.mockResolvedValue({ status: 200 });
    mockGetJwtToken.mockResolvedValue("saved-jwt");
  });

  afterEach(() => {
    firebaseMessagingService.cleanup();
  });

  it("registers the startup FCM token anonymously before auth is restored", async () => {
    await firebaseMessagingService.initialize();

    expect(mockAnonymousPost).toHaveBeenCalledWith(
      "/api/v1/notifications/device-token",
      expect.objectContaining({
        token: "fcm-token-123",
        platform: "IOS",
        deviceInfo: expect.objectContaining({
          brand: "Apple",
          modelName: "iPhone 15",
        }),
      }),
    );
    expect(mockAuthenticatedPost).not.toHaveBeenCalled();
    expect(mockGetJwtToken).not.toHaveBeenCalled();
  });

  it("relinks the same token with auth after authentication", async () => {
    await firebaseMessagingService.registerTokenWithBackend(
      "fcm-token-123",
      "jwt-token-123",
    );

    expect(mockAuthenticatedPost).toHaveBeenCalledWith(
      "/api/v1/notifications/device-token",
      expect.objectContaining({
        token: "fcm-token-123",
        platform: "IOS",
      }),
      { headers: { Authorization: "Bearer jwt-token-123" } },
    );
    expect(mockAnonymousPost).not.toHaveBeenCalled();
  });
});
