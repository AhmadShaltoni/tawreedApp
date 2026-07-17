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

export interface VariantOption {
  id: string;
  name: string;
  nameEn?: string;
  image?: string | null;
  stock: number;
  sku?: string;
  barcode?: string;
  priceOverride?: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  sizeEn: string | null;
  image?: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  minOrderQuantity: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  units: ProductUnit[];
  options: VariantOption[];
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
  /** Original price before discount (shown as strikethrough) */
  compareAtPrice?: number | null;
  /** Campaign discount percentage from API */
  discountPercent?: number | null;
  /** @deprecated Use compareAtPrice instead */
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
  image?: string | null;
  sku?: string | null;
  barcode?: string | null;
  stock: number;
  minOrderQuantity: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  units: ProductUnit[];
  options?: VariantOption[];
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
  /** Discount percentage from campaign (new) */
  discountPercent?: number | null;
  /** Whether this product has an active discount */
  hasDiscount?: boolean;
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
  tags?: string[];
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
  brandId?: string;
  tag?: string;
  includeDescendants?: boolean;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface Brand {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  logo?: string;
  productCount: number;
}

export interface BrandsResponse {
  brands: Brand[];
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
  optionName?: string;
  optionNameEn?: string;
  optionImage?: string | null;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
  unitLabel?: string;
  unitLabelEn?: string;
  piecesPerUnit?: number;
  note?: string;
  isReward?: boolean;
  // Live selection references (present on direct orders) — needed to preload
  // the item into the edit editor and re-price it. Null on legacy/reward lines.
  variantId?: string | null;
  variantOptionId?: string | null;
  productUnitId?: string | null;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  shippingAddress: string;
  city: string;
  notes?: string;
  updatedAt: string;
  statusHistory?: StatusHistoryEntry[];
  subtotal?: number;
  deliveryFee?: number;
  isFreeDelivery?: boolean;
  discountAmount?: number;
  couponCode?: string;
  /** Loyalty reward redeemed/applied on this order (if any) */
  redeemedReward?: OrderRedeemedReward | null;
  /** Buyer's edit request currently awaiting admin review (if any) */
  pendingEditRequest?: OrderEditRequest | null;
}

export interface OrderEditDiffLine {
  productName: string;
  productNameEn?: string | null;
  variantSize?: string | null;
  variantSizeEn?: string | null;
  variantOptionName?: string | null;
  variantOptionNameEn?: string | null;
  unitLabel?: string | null;
  unitLabelEn?: string | null;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface OrderEditDiff {
  added: OrderEditDiffLine[];
  removed: OrderEditDiffLine[];
  changed: {
    before: OrderEditDiffLine;
    after: OrderEditDiffLine;
    quantityDelta: number;
  }[];
  unchanged: OrderEditDiffLine[];
  delivery: Record<string, { before: string | null; after: string | null }>;
  totals: {
    before: { productsTotal: number; deliveryFee: number; grandTotal: number };
    after: { productsTotal: number; deliveryFee: number; grandTotal: number };
  };
}

export interface OrderEditRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  diff: OrderEditDiff | null;
  estimatedTotal: number | null;
  estimatedDeliveryFee: number | null;
  buyerMessage?: string | null;
  createdAt: string;
}

export interface OrderEditRequestItemPayload {
  variantId: string;
  variantOptionId?: string | null;
  productUnitId?: string | null;
  quantity: number;
  note?: string | null;
}

export interface CreateOrderEditRequestPayload {
  items: OrderEditRequestItemPayload[];
  deliveryAddress?: string;
  deliveryAddressDetails?: string;
  deliveryCity?: string;
  deliveryCityId?: string;
  deliveryAreaId?: string;
  buyerNotes?: string;
  buyerMessage?: string;
}

export interface OrderRedeemedReward {
  rewardName?: string | null;
  rewardNameEn?: string | null;
  rewardType?: string | null;
  couponCode?: string | null;
  productName?: string | null;
  productNameEn?: string | null;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string | null;
}

export interface CreateOrderPayload {
  deliveryAddress: string;
  deliveryAddressDetails?: string;
  deliveryCity: string;
  deliveryCityId?: string;
  deliveryAreaId?: string;
  deliveryArea?: string;
  deliveryFee?: number;
  deliveryEstimatedDays?: number;
  buyerNotes?: string;
  notes?: string;
  couponCode?: string;
  loyaltyCouponCode?: string;
  itemNotes?: { cartItemId: string; note: string }[];
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
    image?: string | null;
    stock: number;
    minOrderQuantity: number;
    isDefault: boolean;
    product: ApiProduct;
    units: ProductUnit[];
    options?: VariantOption[];
  };
  variantOptionId?: string | null;
  variantOption?: {
    id: string;
    name: string;
    nameEn?: string;
    image?: string | null;
    stock?: number;
    priceOverride?: number | null;
  } | null;
  productUnitId?: string | null;
  productUnit?: ProductUnit | null;
  quantity: number;
  note?: string;
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
    image?: string | null;
    stock: number;
    minOrderQuantity: number;
    isDefault: boolean;
    product: ApiProduct;
    units: ProductUnit[];
    options?: VariantOption[];
  };
  variantOptionId?: string | null;
  variantOption?: {
    id: string;
    name: string;
    nameEn?: string;
    image?: string | null;
    stock?: number;
    priceOverride?: number | null;
  } | null;
  productUnitId?: string | null;
  productUnit?: ProductUnit | null;
  quantity: number;
  note?: string;
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
  selectedOption?: VariantOption;
  quantity: number;
  selectedUnit?: ProductUnit;
  note?: string;
}

export interface AddToCartPayload {
  variantId: string;
  variantOptionId?: string;
  productUnitId?: string;
  quantity: number;
  note?: string;
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
  linkUrl?: string;
  createdAt: string;
}

// Location
export interface Area {
  id: string;
  name: string;
  nameEn: string;
  latitude?: number;
  longitude?: number;
}

export interface City {
  id: string;
  name: string;
  nameEn: string;
  areas: Area[];
  latitude?: number;
  longitude?: number;
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
  /** True when a loyalty reward coupon is also applied at checkout. */
  hasLoyaltyCoupon?: boolean;
}

export interface CouponValidateSuccess {
  valid: true;
  discountPercent: number;
  discountAmount: number;
  finalTotal: number;
  code: string;
  /** False when the code cannot be combined with a loyalty reward coupon. */
  allowStacking?: boolean;
}

export interface CouponValidateError {
  valid: false;
  error: string;
  message: string;
}

export type CouponValidateResponse =
  | CouponValidateSuccess
  | CouponValidateError;

// ============================================
// Stock Validation
// ============================================
export interface InvalidCartItem {
  cartItemId: string;
  productName: string;
  variantSize?: string;
  optionName?: string;
  requestedQty: number;
  availableQty: number;
}

export interface CartValidationResponse {
  valid: boolean;
  invalidItems?: InvalidCartItem[];
  message?: string;
}

// ============================================
// Delivery
// ============================================
export interface DeliveryFeeResponse {
  fee: number;
  isFree: boolean;
  available: boolean;
  originalFee: number;
  freeThreshold: number | null;
  remainingForFree: number | null;
  estimatedDays: number;
}

export interface DeliveryZone {
  cityId: string;
  fee: number;
  estimatedDays: number;
  freeDeliveryThreshold: number | null;
}

// ============================================
// Marketing Sections
// ============================================
export interface MarketingSection {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  image: string | null;
  showOnHome: boolean;
  sortOrder: number;
  productCount: number;
  products?: Product[];
}

// ============================================
// Loyalty & Rewards System
// ============================================
export * from "./loyalty";
