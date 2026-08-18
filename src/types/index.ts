// ─── Common Types ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Location Types ─────────────────────────────────────────
export interface State {
  id: string;
  name: string;
  code: string;
  country: string;
  isActive: boolean;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  stateId: string;
  isActive: boolean;
}

// ─── Category ────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
}

// ─── User ────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN' | 'SUPER_ADMIN';
  stateId?: string;
  state?: State;
  cityId?: string;
  city?: City;
  pinCode?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string;
  isVerified: boolean;
  isActive: boolean;
  trustScore: number;
  responseRate: number;
  totalRentals: number;
  totalReviews: number;
  avgRating: number;
  createdAt: string;
}

// ─── Product ─────────────────────────────────────────────────
export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  ownerId: string;
  owner: Pick<User, 'id' | 'name' | 'avatarUrl' | 'isVerified' | 'avgRating' | 'totalReviews' | 'trustScore'>;
  categoryId: string;
  category: Category;
  title: string;
  slug: string;
  description?: string;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'DAMAGED';
  brand?: string;
  model?: string;
  purchaseYear?: number;
  dailyPrice: number;
  weeklyPrice?: number;
  securityDeposit: number;
  minRentalDays: number;
  maxRentalDays: number;
  stateId?: string;
  state?: State;
  cityId?: string;
  city?: City;
  pickupAddress?: string;
  latitude?: number;
  longitude?: number;
  deliveryAvailable: boolean;
  deliveryFee: number;
  deliveryRadius: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rentalRules?: string;
  cancellationPolicy?: string;
  ownerNotes?: string;
  totalRentals: number;
  avgRating: number;
  totalReviews: number;
  images: ProductImage[];
  isFavorited?: boolean;
  _count?: { reviews: number; favorites: number };
  createdAt: string;
}

// ─── Rental ──────────────────────────────────────────────────
export type RentalStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_COMPLETED'
  | 'OWNER_PENDING'
  | 'OWNER_ACCEPTED'
  | 'OWNER_REJECTED'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'ACTIVE'
  | 'RETURN_PENDING'
  | 'RETURNED'
  | 'INSPECTION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'OVERDUE';

export interface Rental {
  id: string;
  customerId: string;
  customer: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  ownerId: string;
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  productId: string;
  product: Pick<Product, 'id' | 'title' | 'slug' | 'images' | 'dailyPrice' | 'condition' | 'pickupAddress'>;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  rentalDays: number;
  dailyRate: number;
  rentalAmount: number;
  securityDeposit: number;
  platformFee: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: RentalStatus;
  cancellationReason?: string;
  lateFeePerDay: number;
  totalLateFee: number;
  inspectionResult?: string;
  inspectionNotes?: string;
  payments: Payment[];
  extensionRequests: ExtensionRequest[];
  createdAt: string;
}

// ─── Payment ─────────────────────────────────────────────────
export interface Payment {
  id: string;
  rentalId: string;
  amount: number;
  type: 'RENTAL' | 'DEPOSIT' | 'EXTENSION' | 'REFUND' | 'LATE_FEE';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
}

// ─── Review ──────────────────────────────────────────────────
export interface Review {
  id: string;
  rentalId: string;
  reviewerId: string;
  reviewer: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  targetId: string;
  productId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// ─── Conversation & Message ──────────────────────────────────
export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  productId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  user1?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  user2?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  product?: Pick<Product, 'id' | 'title' | 'images'>;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  isRead: boolean;
  createdAt: string;
}

// ─── Notification ────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: string;
  createdAt: string;
}

// ─── Dispute ─────────────────────────────────────────────────
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'CUSTOMER_RESPONSE' | 'OWNER_RESPONSE' | 'RESOLVED' | 'REJECTED';

export interface Dispute {
  id: string;
  rentalId: string;
  rental?: Rental;
  raisedById: string;
  raisedBy?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  againstId: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  adminNotes?: string;
  createdAt: string;
}

// ─── Coupon ──────────────────────────────────────────────────
export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil?: string;
  usageLimit?: number;
  perUserLimit: number;
  isActive: boolean;
  timesUsed: number;
}

// ─── Extension Request ───────────────────────────────────────
export interface ExtensionRequest {
  id: string;
  rentalId: string;
  requestedDays: number;
  newEndDate: string;
  additionalFee: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  createdAt: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  activeRentals: number;
  completedRentals: number;
  upcomingRentals: number;
  totalSpending: number;
  totalEarnings: number;
  pendingRequests: number;
  productCount: number;
  favoriteCount: number;
  avgRatingReceived: number;
}

// ─── Admin Dashboard ─────────────────────────────────────────
export interface AdminDashboard {
  totalUsers: number;
  totalOwners: number;
  totalListings: number;
  activeRentals: number;
  completedRentals: number;
  overdueRentals: number;
  totalRevenue: number;
  pendingVerifications: number;
  openDisputes: number;
  recentRentals: Rental[];
  monthlyRevenue: { month: string; revenue: number }[];
  rentalsByStatus: { status: string; count: number }[];
  usersByRole: { role: string; count: number }[];
  productsByCategory: { name: string; count: number }[];
}

// ─── App View ────────────────────────────────────────────────
export type AppView =
  | 'landing'
  | 'marketplace'
  | 'product'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'my-rentals'
  | 'my-listings'
  | 'list-item'
  | 'favorites'
  | 'messages'
  | 'conversation'
  | 'notifications'
  | 'profile'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-products'
  | 'admin-rentals'
  | 'admin-disputes';
