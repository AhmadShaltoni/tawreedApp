import {
  categoryService,
  type CategoriesResult,
} from "@/src/services/category.service";
import type { Category } from "@/src/types";
import { getCached, setCache } from "@/src/utils/cache";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface CategoriesState {
  /** Root-level categories only (used by HomeScreen & ProductsListScreen). */
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

/**
 * Fetch ROOT categories for filter chips & home screen.
 * CategoriesScreen does NOT use this — it manages its own local state
 * via categoryService directly to support hierarchical drill-down.
 */
export const fetchCategories = createAsyncThunk(
  "categories/fetch",
  async (_: undefined, { rejectWithValue }) => {
    try {
      const cached = await getCached<CategoriesResult>("categories_root");
      if (cached) return cached.categories;

      const data = await categoryService.getCategories();
      await setCache("categories_root", data);
      return data.categories;
    } catch (error: any) {
      const cached = await getCached<CategoriesResult>("categories_root");
      if (cached) return cached.categories;

      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default categoriesSlice.reducer;
