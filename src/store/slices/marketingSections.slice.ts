import { marketingSectionService } from "@/src/services/marketingSection.service";
import type { MarketingSection } from "@/src/types";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface MarketingSectionsState {
  homeSections: MarketingSection[];
  selectedSection: MarketingSection | null;
  loading: boolean;
  loadingDetail: boolean;
  error: string | null;
}

const initialState: MarketingSectionsState = {
  homeSections: [],
  selectedSection: null,
  loading: false,
  loadingDetail: false,
  error: null,
};

export const fetchHomeSections = createAsyncThunk(
  "marketingSections/fetchHome",
  async (_, { rejectWithValue }) => {
    try {
      return await marketingSectionService.getHomeSections();
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchSectionBySlug = createAsyncThunk(
  "marketingSections/fetchBySlug",
  async (slug: string, { rejectWithValue }) => {
    try {
      return await marketingSectionService.getSectionBySlug(slug);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const marketingSectionsSlice = createSlice({
  name: "marketingSections",
  initialState,
  reducers: {
    clearSelectedSection(state) {
      state.selectedSection = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeSections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeSections.fulfilled, (state, action) => {
        console.log("FULFILLED PAYLOAD", action.payload);
        state.loading = false;
        state.homeSections = action.payload;
      })
      .addCase(fetchHomeSections.rejected, (state, action) => {
        console.log("REJECTED", action.payload);
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSectionBySlug.pending, (state) => {
        state.loadingDetail = true;
        state.error = null;
      })
      .addCase(fetchSectionBySlug.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.selectedSection = action.payload;
      })
      .addCase(fetchSectionBySlug.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedSection } = marketingSectionsSlice.actions;
export default marketingSectionsSlice.reducer;
