import { orderService } from "@/src/services/order.service";
import type {
    CreateOrderPayload,
    EditOrderPayload,
    Order,
    OrderDetail,
} from "@/src/types";
import { getErrorMessage } from "@/src/utils/errorHandler";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface OrdersState {
  items: Order[];
  selectedOrder: OrderDetail | null;
  loading: boolean;
  loadingDetail: boolean;
  creating: boolean;
  updating: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  selectedOrder: null,
  loading: false,
  loadingDetail: false,
  creating: false,
  updating: false,
  error: null,
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
  },
});

export const { clearOrderDetail, clearOrdersError } = ordersSlice.actions;
export default ordersSlice.reducer;
