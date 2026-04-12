import { cartService } from "@/src/services/cart.service";
import type { CartItem, CartItemAPI, Product, ProductUnit } from "@/src/types";
import { getErrorMessage } from "@/src/utils/errorHandler";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { logout } from "./auth.slice";

function mapApiItemToCartItem(item: CartItemAPI): CartItem {
  const selectedUnit =
    item.productUnit ??
    (item.productUnitId && item.product.units
      ? item.product.units.find((u) => u.id === item.productUnitId)
      : undefined) ??
    undefined;

  return {
    cartItemId: item.id,
    product: item.product,
    quantity: item.quantity,
    selectedUnit: selectedUnit ?? undefined,
  };
}

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
      return apiItems.map(mapApiItemToCartItem);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const addToCartAsync = createAsyncThunk(
  "cart/addAsync",
  async (
    {
      product,
      quantity,
      selectedUnit,
    }: { product: Product; quantity: number; selectedUnit?: ProductUnit },
    { rejectWithValue },
  ) => {
    try {
      const apiItem = await cartService.addToCart({
        productId: product.id,
        productUnitId: selectedUnit?.id,
        quantity,
      });
      return mapApiItemToCartItem(apiItem);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateCartItemAsync = createAsyncThunk(
  "cart/updateAsync",
  async (
    { cartItemId, quantity }: { cartItemId: string; quantity: number },
    { rejectWithValue },
  ) => {
    try {
      await cartService.updateCartItem(cartItemId, { quantity });
      return { cartItemId, quantity };
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const removeFromCartAsync = createAsyncThunk(
  "cart/removeAsync",
  async (cartItemId: string, { rejectWithValue }) => {
    try {
      await cartService.removeCartItem(cartItemId);
      return cartItemId;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    updateQuantity(
      state,
      action: PayloadAction<{ cartItemId: string; quantity: number }>,
    ) {
      const item = state.items.find(
        (i) => i.cartItemId === action.payload.cartItemId,
      );
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.cartItemId !== action.payload,
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

    // Add to cart — backend increments quantity, so re-fetch to stay in sync
    builder
      .addCase(addToCartAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCartAsync.fulfilled, (state, action) => {
        state.loading = false;
        const newItem = action.payload;
        const existing = state.items.find(
          (item) => item.cartItemId === newItem.cartItemId,
        );
        if (existing) {
          existing.quantity = newItem.quantity;
        } else {
          state.items.push(newItem);
        }
      })
      .addCase(addToCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update cart item
    builder
      .addCase(updateCartItemAsync.pending, (state, action) => {
        state.updating[action.meta.arg.cartItemId] = true;
      })
      .addCase(updateCartItemAsync.fulfilled, (state, action) => {
        const { cartItemId, quantity } = action.payload;
        delete state.updating[cartItemId];
        const item = state.items.find((i) => i.cartItemId === cartItemId);
        if (item) item.quantity = quantity;
      })
      .addCase(updateCartItemAsync.rejected, (state, action) => {
        delete state.updating[action.meta.arg.cartItemId];
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
          (item) => item.cartItemId !== action.payload,
        );
      })
      .addCase(removeFromCartAsync.rejected, (state, action) => {
        delete state.updating[action.meta.arg];
        state.error = action.payload as string;
      });

    // Clear cart on logout
    builder.addCase(logout.fulfilled, (state) => {
      state.items = [];
      state.error = null;
    });
  },
});

export const { updateQuantity, removeFromCart, clearCart, clearCartError } =
  cartSlice.actions;
export default cartSlice.reducer;
