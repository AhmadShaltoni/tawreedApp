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
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
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
  note?: string;
}

export interface CreateOrderPayload {
  shippingAddress: string;
  city: string;
  notes?: string;
}

export interface CartItemAPI {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AddToCartPayload {
  productId: string;
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
