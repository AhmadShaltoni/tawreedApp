export interface ProductUnit {
  id: string;
  unit: string;
  label: string;
  labelEn: string;
  piecesPerUnit: number;
  price: number;
  compareAtPrice: number | null;
  isDefault: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  discountPrice?: number;
  sku: string;
  images: string[];
  categoryId: string;
  categoryName?: string;
  unit: string;
  minOrder: number;
  stock: number;
  featured: boolean;
  createdAt: string;
  units?: ProductUnit[];
}

/** Raw product shape from the API */
export interface ApiProduct {
  id: string;
  name: string;
  nameEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
  images: string[];
  categoryId: string;
  unit: string;
  sku?: string | null;
  barcode?: string | null;
  stock: number;
  minOrderQuantity: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    nameEn?: string;
    slug: string;
  };
  units?: ProductUnit[];
}

/** Raw API response for products list */
export interface ApiProductsResponse {
  products: ApiProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CategoryImage {
  url: string;
  alt: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  image?: CategoryImage;
  productCount?: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total?: number;
  itemCount: number;
  createdAt: string;
  buyerNotes?: string;
  statusHistory?: StatusHistoryEntry[];
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
  unitLabel?: string;
  unitLabelEn?: string;
  piecesPerUnit?: number;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  shippingAddress: string;
  city: string;
  notes?: string;
  updatedAt: string;
  statusHistory?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string | null;
}

export interface CreateOrderPayload {
  deliveryAddress: string;
  deliveryCity: string;
  buyerNotes?: string;
}

export interface EditOrderPayload {
  deliveryAddress?: string;
  deliveryCity?: string;
  buyerNotes?: string;
}

export interface CartItemAPI {
  id: string;
  productId: string;
  productUnitId?: string | null;
  product: Product;
  productUnit?: ProductUnit | null;
  quantity: number;
}

export interface RawCartItemAPI {
  id: string;
  productId: string;
  productUnitId?: string | null;
  product: ApiProduct;
  productUnit?: ProductUnit | null;
  quantity: number;
}

export interface CartAPIResponse {
  items: RawCartItemAPI[];
  total: number;
  itemCount: number;
}

export interface AddToCartResponse {
  item: RawCartItemAPI;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedUnit?: ProductUnit;
}

export interface AddToCartPayload {
  productId: string;
  productUnitId?: string;
  quantity: number;
}

export interface UpdateCartPayload {
  quantity: number;
}

// Notifications
export type NotificationType =
  | "order_update"
  | "new_product"
  | "promotion"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

// Location
export interface Area {
  id: string;
  name: string;
  nameEn: string;
}

export interface City {
  id: string;
  name: string;
  nameEn: string;
  areas: Area[];
}

export interface UpdateLocationPayload {
  cityId?: string;
  areaId?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateLocationResponse {
  user: {
    id: string;
    cityId: string | null;
    areaId: string | null;
    latitude: number | null;
    longitude: number | null;
    city: { id: string; name: string; nameEn: string } | null;
    area: { id: string; name: string; nameEn: string } | null;
  };
}

// Notices (Admin-managed announcements)
export interface Notice {
  id: string;
  text: string;
  backgroundColor: string; // Hex color, default: #FFA500
  textColor: string; // Hex color, default: #FFFFFF
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Coupons / Discount Codes
export interface CouponValidatePayload {
  code: string;
  orderTotal: number;
}

export interface CouponValidateSuccess {
  valid: true;
  discountPercent: number;
  discountAmount: number;
  finalTotal: number;
  code: string;
}

export interface CouponValidateError {
  valid: false;
  error: string;
  message: string;
}

export type CouponValidateResponse =
  | CouponValidateSuccess
  | CouponValidateError;

export interface CouponConfirmPayload {
  code: string;
  orderId: string;
  orderTotal: number;
}

export interface CouponConfirmResponse {
  success: boolean;
  discountAmount: number;
  usageId: string;
}
