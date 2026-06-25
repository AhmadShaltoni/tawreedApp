import {
    authService,
    type LoginPayload,
    type RegisterPayload,
    type ResendSmsOtpPayload,
    type SendOtpPayload,
    type User,
    type VerifyOtpPayload,
} from "@/src/services/auth.service";
import { notificationService } from "@/src/services/notifications";
import { getToken, removeToken, setToken } from "@/src/services/tokenStorage";
import { clearCache } from "@/src/utils/cache";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isInitialized: boolean;
  otpSending: boolean;
  otpVerifying: boolean;
  verificationToken: string | null;
  deletingAccount: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isGuest: false,
  isInitialized: false,
  otpSending: false,
  otpVerifying: false,
  verificationToken: null,
  deletingAccount: false,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);
      await setToken(response.token);

      // Register FCM token with backend now that user is authenticated
      await notificationService.registerTokenAfterLogin();

      return response;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await authService.register(payload);
      await setToken(response.token);

      // Register FCM token with backend now that user is authenticated
      await notificationService.registerTokenAfterLogin();

      return response;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  },
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const token = await getToken();
      if (!token) {
        return null;
      }
      const user = await authService.getMe();
      await notificationService.registerTokenAfterLogin();
      return { token, user };
    } catch {
      await removeToken();
      return null;
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  // Unregister FCM token from user account
  await notificationService.unregisterTokenOnLogout();

  // Clear JWT token from secure storage
  await removeToken();
});

export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.deleteAccount();

      // Unregister FCM token
      await notificationService.unregisterTokenOnLogout().catch(() => {});

      // Clear JWT token from secure storage
      await removeToken();

      // Clear all cached data (products, categories, etc.)
      await clearCache();

      // Clear any remaining AsyncStorage data
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      await AsyncStorage.clear();

      return response;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  },
);

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (payload: SendOtpPayload, { rejectWithValue }) => {
    try {
      const response = await authService.sendOtp(payload);
      return response;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (payload: VerifyOtpPayload, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOtp(payload);
      return response;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  },
);

export const resendSmsOtp = createAsyncThunk(
  "auth/resendSmsOtp",
  async (payload: ResendSmsOtpPayload, { rejectWithValue }) => {
    try {
      const response = await authService.resendSmsOtp(payload);
      return response;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  },
);

export const updateUserLocation = createAsyncThunk(
  "auth/updateLocation",
  async (payload: { cityId: string; areaId?: string }, { rejectWithValue }) => {
    try {
      const user = await authService.updateLocation(
        payload.cityId,
        payload.areaId,
      );
      return user;
    } catch (error: any) {
      const message = getErrorMessage(error);
      return rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    continueAsGuest(state) {
      state.isGuest = true;
      state.isInitialized = true;
    },
    updateUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Restore Session
    builder
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          // No token found — automatically enable guest mode for first launch
          state.isGuest = true;
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
        // Failed authentication — enable guest mode
        state.isGuest = true;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = true; // Return to guest mode after logout
      state.error = null;
    });

    // Update Location
    builder
      .addCase(updateUserLocation.fulfilled, (state, action) => {
        if (state.user) {
          state.user = action.payload;
        }
      })
      .addCase(updateUserLocation.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Send OTP
    builder
      .addCase(sendOtp.pending, (state) => {
        state.otpSending = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.otpSending = false;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.otpSending = false;
        state.error = action.payload as string;
      });

    // Verify OTP (registration phone verification — does NOT authenticate)
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.otpVerifying = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.otpVerifying = false;
        state.verificationToken = action.payload.verificationToken;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.otpVerifying = false;
        state.error = action.payload as string;
      });

    // Delete Account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.deletingAccount = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.deletingAccount = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isGuest = true;
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deletingAccount = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, continueAsGuest, updateUser } = authSlice.actions;
export default authSlice.reducer;
