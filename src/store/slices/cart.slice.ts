import { cartService } from "@/src/services/cart.service";
import type { CartItem, Product } from "@/src/types";
import {
    createAsyncThunk,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";

interface CartState {
  items: CartItem[];
  loading: boolean;
  updating: Record<string, boolean>;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  updating: {},
  error: null,
};

export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const apiItems = await cartService.getCart();
      return apiItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      }));
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to load cart",
      );
    }
  },
);

export const addToCartAsync = createAsyncThunk(
  "cart/addAsync",
  async (
    { product, quantity }: { product: Product; quantity: number },
    { rejectWithValue },
  ) => {
    try {
      await cartService.addToCart({
        productId: product.id,
        quantity,
      });
      return { product, quantity };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to add to cart",
      );
    }
  },
);

export const updateCartItemAsync = createAsyncThunk(
  "cart/updateAsync",
  async (
    { productId, quantity }: { productId: string; quantity: number },
    { rejectWithValue },
  ) => {
    try {
      await cartService.updateCartItem(productId, { quantity });
      return { productId, quantity };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to update cart",
      );
    }
  },
);

export const removeFromCartAsync = createAsyncThunk(
  "cart/removeAsync",
  async (productId: string, { rejectWithValue }) => {
    try {
      await cartService.removeCartItem(productId);
      return productId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to remove item",
      );
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(
      state,
      action: PayloadAction<{ product: Product; quantity: number }>,
    ) {
      const { product, quantity } = action.payload;
      const existing = state.items.find(
        (item) => item.product.id === product.id,
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }
    },
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) {
      const item = state.items.find(
        (i) => i.product.id === action.payload.productId,
      );
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.product.id !== action.payload,
      );
    },
    clearCart(state) {
      state.items = [];
      state.error = null;
    },
    clearCartError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add to cart
    builder
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        const { product, quantity } = action.payload;
        const existing = state.items.find(
          (item) => item.product.id === product.id,
        );
        if (existing) {
          existing.quantity += quantity;
        } else {
          state.items.push({ product, quantity });
        }
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update cart item
    builder
      .addCase(updateCartItemAsync.pending, (state, action) => {
        state.updating[action.meta.arg.productId] = true;
      })
      .addCase(updateCartItemAsync.fulfilled, (state, action) => {
        const { productId, quantity } = action.payload;
        delete state.updating[productId];
        const item = state.items.find((i) => i.product.id === productId);
        if (item) item.quantity = quantity;
      })
      .addCase(updateCartItemAsync.rejected, (state, action) => {
        delete state.updating[action.meta.arg.productId];
        state.error = action.payload as string;
      });

    // Remove from cart
    builder
      .addCase(removeFromCartAsync.pending, (state, action) => {
        state.updating[action.meta.arg] = true;
      })
      .addCase(removeFromCartAsync.fulfilled, (state, action) => {
        delete state.updating[action.payload];
        state.items = state.items.filter(
          (item) => item.product.id !== action.payload,
        );
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        delete state.updating[action.meta.arg];
        state.error = action.payload as string;
      });
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  clearCartError,
} = cartSlice.actions;
export default cartSlice.reducer;
