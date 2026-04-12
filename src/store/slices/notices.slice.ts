import { noticeService } from "@/src/services/notice.service";
import type { Notice } from "@/src/types";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface NoticesState {
  items: Notice[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
}

const initialState: NoticesState = {
  items: [],
  currentIndex: 0,
  loading: false,
  error: null,
};

export const fetchNotices = createAsyncThunk(
  "notices/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await noticeService.getNotices();
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const noticesSlice = createSlice({
  name: "notices",
  initialState,
  reducers: {
    nextNotice(state) {
      if (state.items.length > 0) {
        state.currentIndex = (state.currentIndex + 1) % state.items.length;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.currentIndex = 0; // Reset to first notice on fetch
      })
      .addCase(fetchNotices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { nextNotice } = noticesSlice.actions;
export default noticesSlice.reducer;
