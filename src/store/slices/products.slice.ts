import { productService } from "@/src/services/product.service";
import type { Product, ProductFilters } from "@/src/types";
import { getCached, setCache } from "@/src/utils/cache";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface ProductsState {
  items: Product[];
  featured: Product[];
  selectedProduct: Product | null;
  total: number;
  page: number;
  loading: boolean;
  loadingMore: boolean;
  loadingDetail: boolean;
  error: string | null;
  filters: ProductFilters;
}

const initialState: ProductsState = {
  items: [],
  featured: [],
  selectedProduct: null,
  total: 0,
  page: 1,
  loading: false,
  loadingMore: false,
  loadingDetail: false,
  error: null,
  filters: { page: 1, limit: 20 },
};

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (filters: ProductFilters | undefined, { rejectWithValue }) => {
    try {
      return await productService.getProducts(filters);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to load products",
      );
    }
  },
);

export const fetchMoreProducts = createAsyncThunk(
  "products/fetchMoreProducts",
  async (filters: ProductFilters, { rejectWithValue }) => {
    try {
      return await productService.getProducts(filters);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to load more products",
      );
    }
  },
);

export const fetchFeaturedProducts = createAsyncThunk(
  "products/fetchFeatured",
  async (options: { force?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const shouldUseCache = !options?.force;

      if (shouldUseCache) {
        const cached = await getCached<Product[]>("featured_products");
        if (cached) return cached;
      }

      const response = await productService.getFeatured();
      await setCache("featured_products", response.products);
      return response.products;
    } catch (error: any) {
      const cached = await getCached<Product[]>("featured_products");
      if (cached) return cached;

      return rejectWithValue(
        error.response?.data?.message ?? "Failed to load featured products",
      );
    }
  },
);

export const fetchProductDetail = createAsyncThunk(
  "products/fetchDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      return await productService.getProduct(id);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to load product",
      );
    }
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    clearFilters(state) {
      state.filters = { page: 1, limit: 20 };
    },
    clearSelectedProduct(state) {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch more (pagination)
    builder
      .addCase(fetchMoreProducts.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(fetchMoreProducts.fulfilled, (state, action) => {
        state.loadingMore = false;
        state.items = [...state.items, ...action.payload.products];
        state.total = action.payload.total;
        state.page = action.payload.page;
      })
      .addCase(fetchMoreProducts.rejected, (state) => {
        state.loadingMore = false;
      });

    // Featured
    builder.addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
      state.featured = action.payload;
    });

    // Detail
    builder
      .addCase(fetchProductDetail.pending, (state) => {
        state.loadingDetail = true;
        state.error = null;
      })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedProduct } =
  productsSlice.actions;
export default productsSlice.reducer;
