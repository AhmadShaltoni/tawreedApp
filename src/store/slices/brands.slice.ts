import { brandService } from "@/src/services/brand.service";
import type { Brand } from "@/src/types";
import { getCached, setCache } from "@/src/utils/cache";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface BrandsState {
  items: Brand[];
  loading: boolean;
  error: string | null;
}

const initialState: BrandsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchBrands = createAsyncThunk(
  "brands/fetch",
  async (_: undefined, { rejectWithValue }) => {
    try {
      const cached = await getCached<Brand[]>("brands");
      if (cached) return cached;

      const brands = await brandService.getBrands();
      await setCache("brands", brands);
      return brands;
    } catch (error: any) {
      const cached = await getCached<Brand[]>("brands");
      if (cached) return cached;

      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const brandsSlice = createSlice({
  name: "brands",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default brandsSlice.reducer;
