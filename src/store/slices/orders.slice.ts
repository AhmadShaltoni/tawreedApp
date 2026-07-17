import { orderService } from "@/src/services/order.service";
import type {
    CreateOrderEditRequestPayload,
    CreateOrderPayload,
    EditOrderPayload,
    Order,
    OrderDetail,
} from "@/src/types";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface LastDeliveryAddress {
  address: string;
  cityId?: string;
  areaId?: string;
}

interface OrdersState {
  items: Order[];
  selectedOrder: OrderDetail | null;
  loading: boolean;
  loadingDetail: boolean;
  creating: boolean;
  updating: boolean;
  error: string | null;
  lastDeliveryAddress: LastDeliveryAddress | null;
  loadingLastAddress: boolean;
}

const initialState: OrdersState = {
  items: [],
  selectedOrder: null,
  loading: false,
  loadingDetail: false,
  creating: false,
  updating: false,
  error: null,
  lastDeliveryAddress: null,
  loadingLastAddress: false,
};

export const fetchOrders = createAsyncThunk(
  "orders/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await orderService.getOrders();
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchOrderDetail = createAsyncThunk(
  "orders/fetchDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      return await orderService.getOrderDetail(id);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createOrder = createAsyncThunk(
  "orders/create",
  async (payload: CreateOrderPayload, { rejectWithValue }) => {
    console.log("🔵 Redux: createOrder thunk started with payload:", payload);
    try {
      const result = await orderService.createOrder(payload);
      console.log("🟢 Redux: orderService.createOrder returned:", result);
      return result;
    } catch (error: any) {
      console.error("🔴 Redux: createOrder error:", error);
      const errorMessage = getErrorMessage(error);
      console.error("🔴 Redux: Error message:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
);

export const validateCartBeforeCheckout = createAsyncThunk(
  "orders/validateCart",
  async (_, { rejectWithValue }) => {
    console.log("🔵 Redux: validateCartBeforeCheckout thunk started");
    try {
      const result = await orderService.validateCart();
      console.log("🟢 Redux: Cart validation result:", result);
      return result;
    } catch (error: any) {
      console.error("🔴 Redux: Cart validation error:", error);
      const errorMessage = getErrorMessage(error);
      console.error("🔴 Redux: Error message:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  },
);

export const fetchLastDeliveryAddress = createAsyncThunk(
  "orders/fetchLastDeliveryAddress",
  async (_, { rejectWithValue }) => {
    try {
      return await orderService.getLastDeliveryAddress();
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateOrder = createAsyncThunk(
  "orders/update",
  async (
    { id, payload }: { id: string; payload: EditOrderPayload },
    { rejectWithValue },
  ) => {
    try {
      return await orderService.updateOrder(id, payload);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const submitOrderEditRequest = createAsyncThunk(
  "orders/submitEditRequest",
  async (
    { id, payload }: { id: string; payload: CreateOrderEditRequestPayload },
    { rejectWithValue },
  ) => {
    try {
      return await orderService.submitEditRequest(id, payload);
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const cancelOrderEditRequest = createAsyncThunk(
  "orders/cancelEditRequest",
  async (id: string, { rejectWithValue }) => {
    try {
      await orderService.cancelEditRequest(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrderDetail(state) {
      state.selectedOrder = null;
    },
    clearOrdersError(state) {
      state.error = null;
    },
    setLastDeliveryAddress(state, action) {
      state.lastDeliveryAddress = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch order detail
    builder
      .addCase(fetchOrderDetail.pending, (state) => {
        state.loadingDetail = true;
        state.error = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.error = action.payload as string;
      });

    // Create order
    builder
      .addCase(createOrder.pending, (state) => {
        console.log("🟡 Redux: createOrder.pending");
        state.creating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        console.log("🟢 Redux: createOrder.fulfilled");
        state.creating = false;
        state.items = [
          {
            id: action.payload.id,
            orderNumber: action.payload.orderNumber,
            status: action.payload.status,
            total: action.payload.total,
            itemCount: action.payload.items?.length ?? 0,
            createdAt: action.payload.createdAt,
            items: action.payload.items,
          },
          ...state.items,
        ];
      })
      .addCase(createOrder.rejected, (state, action) => {
        console.log(
          "🔴 Redux: createOrder.rejected with error:",
          action.payload,
        );
        state.creating = false;
        state.error = action.payload as string;
      });

    // Validate cart before checkout
    builder
      .addCase(validateCartBeforeCheckout.pending, (state) => {
        console.log("🟡 Redux: validateCartBeforeCheckout.pending");
        state.loading = true;
        state.error = null;
      })
      .addCase(validateCartBeforeCheckout.fulfilled, (state, action) => {
        console.log(
          "🟢 Redux: validateCartBeforeCheckout.fulfilled",
          action.payload,
        );
        state.loading = false;
        // No state update needed - component will handle the response
      })
      .addCase(validateCartBeforeCheckout.rejected, (state, action) => {
        console.log(
          "🔴 Redux: validateCartBeforeCheckout.rejected with error:",
          action.payload,
        );
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update order
    builder
      .addCase(updateOrder.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.updating = false;
        state.selectedOrder = action.payload;
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = {
            ...state.items[idx],
            status: action.payload.status,
            total: action.payload.total,
          };
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });

    // Submit edit request
    builder
      .addCase(submitOrderEditRequest.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(submitOrderEditRequest.fulfilled, (state, action) => {
        state.updating = false;
        // Reflect the new pending request on the currently-open order so the
        // detail screen shows the "awaiting review" banner immediately.
        if (state.selectedOrder) {
          state.selectedOrder.pendingEditRequest = action.payload;
        }
      })
      .addCase(submitOrderEditRequest.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });

    // Cancel edit request
    builder
      .addCase(cancelOrderEditRequest.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(cancelOrderEditRequest.fulfilled, (state) => {
        state.updating = false;
        if (state.selectedOrder) {
          state.selectedOrder.pendingEditRequest = null;
        }
      })
      .addCase(cancelOrderEditRequest.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload as string;
      });

    // Fetch last delivery address
    builder
      .addCase(fetchLastDeliveryAddress.pending, (state) => {
        state.loadingLastAddress = true;
      })
      .addCase(fetchLastDeliveryAddress.fulfilled, (state, action) => {
        state.loadingLastAddress = false;
        state.lastDeliveryAddress = action.payload;
      })
      .addCase(fetchLastDeliveryAddress.rejected, (state) => {
        state.loadingLastAddress = false;
      });
  },
});

export const { clearOrderDetail, clearOrdersError, setLastDeliveryAddress } =
  ordersSlice.actions;
export default ordersSlice.reducer;
