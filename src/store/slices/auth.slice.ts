import {
  authService,
  type LoginPayload,
  type RegisterPayload,
  type User,
} from "@/src/services/auth.service";
import { getToken, removeToken, setToken } from "@/src/services/tokenStorage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isGuest: false,
  isInitialized: false,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);
      await setToken(response.token);
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message ?? error.message ?? "Login failed";
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
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message ?? error.message ?? "Registration failed";
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
      return { token, user };
    } catch {
      await removeToken();
      return null;
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await removeToken();
});

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
          // New users automatically start as guests
          state.isGuest = true;
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
        // Failed authentication - set as guest
        state.isGuest = true;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.error = null;
    });
  },
});

export const { clearError, continueAsGuest } = authSlice.actions;
export default authSlice.reducer;
