import { configureStore } from "@reduxjs/toolkit";
import {
    useDispatch,
    useSelector,
    type TypedUseSelectorHook,
} from "react-redux";
import authReducer from "./slices/auth.slice";
import brandsReducer from "./slices/brands.slice";
import cartReducer from "./slices/cart.slice";
import categoriesReducer from "./slices/categories.slice";
import loyaltyReducer from "./slices/loyalty.slice";
import marketingSectionsReducer from "./slices/marketingSections.slice";
import noticesReducer from "./slices/notices.slice";
import notificationsReducer from "./slices/notifications.slice";
import ordersReducer from "./slices/orders.slice";
import productsReducer from "./slices/products.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    brands: brandsReducer,
    products: productsReducer,
    categories: categoriesReducer,
    cart: cartReducer,
    orders: ordersReducer,
    notices: noticesReducer,
    notifications: notificationsReducer,
    loyalty: loyaltyReducer,
    marketingSections: marketingSectionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
