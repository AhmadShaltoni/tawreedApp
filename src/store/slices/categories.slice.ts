import { categoryService } from "@/src/services/category.service";
import type { Category } from "@/src/types";
import { getCached, setCache } from "@/src/utils/cache";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface CategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  "categories/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const cached = await getCached<Category[]>("categories");
      if (cached) return cached;

      const data = await categoryService.getCategories();
      await setCache("categories", data);
      return data;
    } catch (error: any) {
      const cached = await getCached<Category[]>("categories");
      if (cached) return cached;

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
