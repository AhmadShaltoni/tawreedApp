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

export interface ProductVariant {
  id: string;
  size: string;
  sizeEn: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  minOrderQuantity: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  units: ProductUnit[];
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  images: string[];
  categoryId: string;
  categoryName?: string;
  isActive: boolean;
  createdAt: string;
  variants: ProductVariant[];
  /** Convenience: derived from default variant's default unit */
  price: number;
  discountPrice?: number;
  /** Convenience: derived from default variant */
  stock: number;
  minOrder: number;
  sku: string;
  unit: string;
  featured: boolean;
  /** @deprecated Use variants[].units instead */
  units?: ProductUnit[];
}

/** Raw API variant shape */
export interface ApiProductVariant {
  id: string;
  size: string;
  sizeEn?: string | null;
  sku?: string | null;
  barcode?: string | null;
  stock: number;
  minOrderQuantity: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  units: ProductUnit[];
}

/** Raw product shape from the API */
export interface ApiProduct {
  id: string;
  name: string;
  nameEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  image?: string | null;
  images?: string[];
  categoryId: string;
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
  variants?: ApiProductVariant[];
  /** @deprecated Old flat fields — kept for backward compat */
  price?: number;
  compareAtPrice?: number | null;
  unit?: string;
  sku?: string | null;
  barcode?: string | null;
  stock?: number;
  minOrderQuantity?: number;
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
  nameEn?: string;
  nameAr?: string;
  slug: string;
  parentId: string | null;
  depth: number;
  hasChildren: boolean;
  childrenCount: number;
  productsCount: number;
  image?: CategoryImage;
  children?: Category[];
  /** @deprecated Use productsCount instead */
  productCount?: number;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  image?: CategoryImage | null;
  depth?: number;
  hasChildren?: boolean;
  childrenCount?: number;
  productsCount?: number;
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
  includeDescendants?: boolean;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
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
  productNameEn?: string;
  productImage?: string;
  variantSize?: string;
  variantSizeEn?: string;
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
  couponCode?: string;
}

export interface EditOrderPayload {
  deliveryAddress?: string;
  deliveryCity?: string;
  buyerNotes?: string;
}

export interface CartItemAPI {
  id: string;
  variantId: string;
  variant: {
    id: string;
    size: string;
    sizeEn?: string | null;
    stock: number;
    minOrderQuantity: number;
    isDefault: boolean;
    product: ApiProduct;
    units: ProductUnit[];
  };
  productUnitId?: string | null;
  productUnit?: ProductUnit | null;
  quantity: number;
  /** @deprecated Use variant.product */
  product?: Product;
  /** @deprecated Use variantId */
  productId?: string;
}

export interface RawCartItemAPI {
  id: string;
  variantId: string;
  variant: {
    id: string;
    size: string;
    sizeEn?: string | null;
    stock: number;
    minOrderQuantity: number;
    isDefault: boolean;
    product: ApiProduct;
    units: ProductUnit[];
  };
  productUnitId?: string | null;
  productUnit?: ProductUnit | null;
  quantity: number;
  /** @deprecated backward compat */
  productId?: string;
  /** @deprecated backward compat */
  product?: ApiProduct;
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
  variant?: ProductVariant;
  quantity: number;
  selectedUnit?: ProductUnit;
}

export interface AddToCartPayload {
  variantId: string;
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
