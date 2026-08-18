# RentLoop - Worklog

---
Task ID: 0
Agent: Main
Task: Project initialization and database setup

Work Log:
- Explored existing project structure
- Installed bcryptjs, socket.io-client
- Created comprehensive Prisma schema with 20+ models
- Pushed schema to SQLite database
- Generated Prisma client

Stage Summary:
- Database schema created with User, Product, Rental, Payment, Review, Dispute, Message, etc.
- Prisma client generated successfully

---
Task ID: 1
Agent: Sub-agent (seed-data)
Task: Create seed data script and populate database

Work Log:
- Read existing Prisma schema and db import to understand data model
- Created /home/z/my-project/prisma/seed.ts with comprehensive seed data
- Fixed escape sequence issue in source file
- Reset database and ran seed script successfully

Stage Summary:
- Seed script creates: 10 states, 30 cities, 15 categories, 10 users, 30 products, 20 rentals, 15 reviews, 2 coupons, 10 notifications, 15 favorites
- All users have bcryptjs-hashed passwords ('password123'), isVerified: true, isActive: true
- Users include 1 SUPER_ADMIN, 1 ADMIN, 3 OWNERS, 5 CUSTOMERS across multiple states
- 30 products with realistic Indian rental data, all status APPROVED
- 20 rentals across all statuses: 3 ACTIVE, 4 COMPLETED, 2 OWNER_PENDING, 2 OWNER_ACCEPTED, 2 RETURN_PENDING, 2 OVERDUE, 2 CANCELLED, 3 PENDING_PAYMENT
- Active rentals have past start dates and future end dates; overdue rentals have past end dates
- 2 coupons: SAVE10 (10% off) and FLAT100 (₹100 off)
- Database seeded and verified successfully

---
Task ID: 2
Agent: Main
Task: Create all backend API routes for RentLoop

Work Log:
- Created /src/lib/auth.ts with HMAC-SHA256 session system (createSession, verifySession, destroySession, getSession)
- Created auth routes: register (POST), login (POST), logout (POST), me (GET)
- Created public routes: states (GET), categories (GET)
- Created products routes: list/create (GET/POST), detail/update/delete (GET/PATCH/DELETE), favorite toggle (POST), availability check (GET), reviews (GET)
- Created rentals routes: list/create (GET/POST), detail/status (GET/PATCH), pay (POST), cancel (POST), return (POST), extend (POST), extend respond (POST)
- Created reviews route (POST) - customer/owner review creation with rating aggregation
- Created conversations routes: list/create (GET/POST), messages (GET/POST) with read tracking
- Created notifications route (GET/PATCH) with mark-read and markAll support
- Created disputes routes: list/create (GET/POST), detail/update (GET/PATCH)
- Created coupon validate route (POST)
- Created user dashboard route (GET) with spending/earnings/rental stats
- Created admin dashboard route (GET) with monthly revenue, rentalsByStatus, usersByRole, productsByCategory
- Created admin users routes: list (GET) with search/filter/pagination, update (PATCH) with verify/suspend/activate/role actions + audit logs
- Created admin products routes: list (GET) with status/search filter, update (PATCH) with approve/reject/suspend + audit logs + notifications
- Created admin rentals routes: list (GET) with status/search filter, update (PATCH) with status changes/refunds/dispute resolution + audit logs

Stage Summary:
- 33 API route files + 1 auth utility created across 18 endpoint groups
- All routes use NextRequest/NextResponse from next/server
- Zod validation on auth register, login, product create, rental create, review create, message create, dispute create, extension request/respond
- Session system uses in-memory Map with HMAC-SHA256 signed tokens, 7-day expiry
- Auth via getSession() reading from cookie or Authorization Bearer header
- All routes have try/catch with proper error responses and status codes
- Rental creation enforces: server-side price from DB, state matching, availability check, min/max rental days, coupon validation
- Payment simulation marks COMPLETED and transitions rental to OWNER_PENDING
- Return flow: customer initiates RETURN_PENDING → owner processes RETURNED/INSPECTION → auto-refund deposit if GOOD condition
- Extension flow: customer requests → owner approves/rejects → approved creates additional payment
- Admin actions create AuditLog entries and send notifications to affected users
- ESLint passes clean, all tested endpoints return correct data

---
Task ID: 3
Agent: Main
Task: Create RentLoop landing page components

Work Log:
- Read worklog.md, types/index.ts, and store/index.ts for context
- Created /src/components/rentloop/landing/ directory
- Created HeroSection.tsx: full-viewport hero with dark navy gradient, gradient text heading, floating Lucide icons (Camera, Laptop, Bike, Drill, Sparkles) animated via Framer Motion, two CTA buttons (Explore Rentals → marketplace, List Your Item → list-item or auth modal), animated stat counters (10K+ Items, 500+ Owners, 25K+ Rentals, 4.9 Rating) with IntersectionObserver
- Created CategoriesSection.tsx: 15 category cards in responsive grid (5 cols desktop, 3 tablet, 2 mobile), stagger animation, hover scale/shadow, click navigates to marketplace with category filter
- Created HowItWorksSection.tsx: 4 step cards (Browse, Book, Receive, Return) with step number circles, Lucide icons, connector lines on desktop, stagger whileInView animations
- Created TrendingSection.tsx: 6 mock product cards with gradient placeholders + Lucide icons, star ratings, ₹ pricing, location badges, Rent Now buttons navigating to product detail
- Created WhyRentSection.tsx: 6 benefit cards (Save Money, Declutter, Try Before Buy, Access Premium, Eco Friendly, Flexibility) with colored icon containers
- Created TrustSection.tsx: dark navy section with 4 trust indicators (Verified Owners 500+, Secure Payments 100%, Customer Support 24/7, Satisfaction Rate 98%) with animated counters
- Created ReviewsSection.tsx: 4 Indian-sounding review cards with star ratings, Avatar component, Quote icon, product badges, realistic review text
- Created FAQSection.tsx: 8-item Accordion using shadcn Accordion component covering renting, payments, deposits, cancellations, etc.
- Created CTASection.tsx: final call-to-action with gradient background, glow effects, two buttons (Get Started → register, List Your First Item → list-item)
- Created LandingPage.tsx: main container rendering all sections in order with scroll-to-top on mount
- Updated page.tsx to render LandingPage
- ESLint passes clean, page compiles and renders successfully

Stage Summary:
- 10 landing page components created in /src/components/rentloop/landing/
- Navy (#0f172a) / emerald-500 color scheme with white/slate sections
- All components use 'use client', framer-motion, lucide-react, shadcn/ui
- Navigation via useAppStore(s => s.navigate)
- Fully responsive with mobile-first approach
- No Three.js or React Three Fiber used
- ESLint clean, dev server compiles successfully

---
Task ID: 4
Agent: Main
Task: Create marketplace and product detail UI components

Work Log:
- Read worklog.md, types/index.ts, store/index.ts, api.ts, calendar.tsx for context
- Created /src/components/rentloop/marketplace/ directory
- Created ProductCard.tsx: product card component with gradient image placeholder using category-specific Lucide icons, hover zoom effect via framer-motion (whileHover y:-4 scale:1.02), category badge, condition badge with color mapping, star rating display, daily price in ₹ (emerald bold) + deposit (muted), location with MapPin, verified owner ShieldCheck badge, favorite Heart toggle with API call, View Details and Rent Now buttons (auth-gated), responsive layout
- Created MarketplacePage.tsx: full marketplace page with search bar (debounced 400ms), state location selector dropdown (Syncs with store selectedState), sort dropdown (Recommended/Price Low→High/Price High→Low/Highest Rated/Newest/Most Rented), filter popover with condition pills, min/max price inputs, delivery-only Switch, horizontal scrollable category pills, responsive product grid (1/2/3/4 cols), pagination with smart page number windowing, AnimatePresence for grid transitions, loading skeleton, empty state with PackageOpen icon, error state with retry button, location restriction banner, TanStack Query for products/states/categories
- Created /src/components/rentloop/product/ directory
- Created ProductDetailPage.tsx: full product detail page with back button, large gradient image placeholder, title/category/condition badges, star rating, price section (daily + weekly with savings badge + deposit + delivery fee), owner info card (Avatar, name, verified badge, rating, total rentals, trust score, Message button), location section with delivery badge, state mismatch warning (disabled rent), tabs (Description/Rental Rules/Cancellation), rental calculator with Calendar date pickers (start/end), real-time calculation breakdown (days, daily rate, rental amount, platform fee 10%, GST 18%, delivery fee, deposit, coupon discount, total), coupon code input with apply mutation, Rent Now CTA with auth/state/availability checks, availability calendar with unavailable date highlighting, reviews section with star breakdown bars and review list with Avatar, loading skeleton, error state
- Updated page.tsx to render MarketplacePage instead of LandingPage
- Fixed React Compiler lint errors: replaced useEffect+setState for favorite sync with derived state, replaced useMemo rental calculator with plain function
- ESLint passes clean, dev server compiles and renders successfully with API calls working

Stage Summary:
- 3 new components created: ProductCard.tsx, MarketplacePage.tsx, ProductDetailPage.tsx
- Navy (#0f172a) primary, emerald-600 accent, ₹ pricing throughout
- TanStack Query for data fetching with proper query keys
- Framer Motion animations (hover, stagger, fade-in)
- Full responsive design (mobile-first, 1-4 column grid)
- Auth gating on favorite/rent actions
- State-based location filtering with restriction warnings
- Real-time rental calculator with coupon support
- ESLint clean, dev server compiles successfully

---
Task ID: 5
Agent: Main
Task: Create RentLoop authentication UI components

Work Log:
- Read worklog.md, types/index.ts, store/index.ts, api.ts for context
- Created /src/components/rentloop/auth/ directory
- Created AuthModal.tsx: modal dialog triggered by store.authModalOpen, two views (login/register) toggled by store.authModalView and tab switcher in navy header bar
  - Login view: email+password fields with icon prefixes (Mail, Lock), password toggle (Eye/EyeOff), "Forgot Password?" toast link, loading state with Loader2 spinner, error display (server + field-level), success fetches api.me and sets user in store, navigates to returnUrl or marketplace
  - Register view: Full Name, Email, Phone, Password (min 6), State select (fetched via api.getStates), City select (populated from selected state's cities), PIN Code, Address textarea, Terms checkbox with emerald styling, "Create Account" emerald button, loading/error states
  - Uses react-hook-form + zodResolver + zod v4 schemas for validation on both forms
  - Controller used for Select and Checkbox fields
  - States fetched on mount with loading state
  - Navy header bar with RentLoop logo and Login/Sign Up toggle pills
- Created LoginPage.tsx: full-page login with split layout
  - Left panel (lg+): navy bg (#0f172a) with decorative blur gradients, dot grid pattern, RentLoop logo, "Rent anything, anywhere" tagline with emerald accent, 4 feature cards (Verified Owners, Instant Booking, Flexible Rentals, Top Rated) with staggered framer-motion animations, testimonial card at bottom
  - Right panel: centered login form with same fields as modal login (email, password, show/hide, forgot password link), "or" divider, sign up link opens auth modal in register view, back to home link
  - Mobile: full-width form with logo, back link at top
  - Framer motion fadeInUp and stagger animations throughout
  - Custom inline LoaderIcon SVG for loading state
- Updated page.tsx: view router with switch/case for landing, marketplace, product, login views; AuthModal always rendered
- Created /src/components/Providers.tsx: QueryClientProvider wrapper for TanStack Query
- Updated layout.tsx: wrapped children + Toaster in Providers
- Fixed ESLint error: removed synchronous setLoadingStates(true) in useEffect, initialized state to true instead
- Fixed QueryClient missing error by adding Providers wrapper to layout

Stage Summary:
- 2 auth components + 1 provider component created
- AuthModal: dual login/register modal with zod validation, state/city cascading selects, terms checkbox
- LoginPage: split-layout full-page login with branded left panel, framer-motion animations
- Navy (#0f172a) primary, emerald-600 accent, consistent with project design system
- React Hook Form + Zod v4 validation throughout
- ESLint passes clean (1 warning: react-hook-form watch incompatible-library, expected)
- Dev server compiles and renders successfully (HTTP 200)

---
Task ID: 6
Agent: Main
Task: Create rentals management and product listing UI components

Work Log:
- Read worklog.md, types/index.ts, store/index.ts, api.ts for context
- Read existing DashboardPage.tsx and ProductCard.tsx for coding patterns and style conventions
- Created /src/components/rentloop/rentals/ directory
- Created MyRentalsPage.tsx: full rentals page with 7 tabs (All, Upcoming, Active, Returning, Completed, Cancelled, Overdue)
  - Each tab filters by status mapping (statusToTab record)
  - Rental cards with gradient thumbnail placeholder, product title, rental period (date-fns format), total ₹ amount, color-coded status badge
  - Status colors: PENDING_PAYMENT=amber, OWNER_PENDING=amber, OWNER_ACCEPTED=blue, ACTIVE=emerald, RETURN_PENDING=orange, RETURNED=blue, COMPLETED=green, CANCELLED=gray, OVERDUE=red, DISPUTED=red
  - Context-aware action buttons per status (Pay Now/Cancel, Reject, Start Return/Extend, Confirm Return, Return Now/Contact Owner, Rent Again)
  - CountdownTimer component updating every second for ACTIVE/OVERDUE rentals
  - Dual query fetching (role=customer + role=owner) merged and deduplicated by ID
  - Tab counts with emerald badges for active tab
  - Loading skeletons, empty state per tab with marketplace CTA
  - AnimatePresence for card transitions, framer-motion animations
  - Mutations for pay, cancel, return with toast notifications and query invalidation
  - Click card opens RentalDetailDialog
- Created RentalDetailDialog.tsx: full rental detail dialog using shadcn Dialog
  - Fetches rental by ID with useQuery on open
  - Product info card (clickable navigates to product detail)
  - Owner and customer info with Avatar/Fallback
  - Date range display with rental period
  - Complete pricing breakdown (rental, platform fee 10%, GST 18%, delivery, discount, deposit, late fee, total)
  - Status timeline with vertical line, checkmark circles, current/emerald/reached/terminal states
  - Handles CANCELLED, OVERDUE, DISPUTED, OWNER_REJECTED as terminal states in timeline
  - Payment history list with type icons, amounts, date, status badges
  - Extension requests section with status, fee, reason, approve/reject buttons for owners
  - Full action buttons matching MyRentalsPage (Pay, Cancel, Return, Confirm Return, Rent Again, Contact Owner)
  - Loading skeleton state
- Created MyListingsPage.tsx: user's product listings page
  - Grid layout (1/2/3 cols responsive) of product cards
  - Each card: gradient image placeholder with category icon, status badge, category badge, title, ₹ price with emerald, star rating, rental count, location, View/Edit/Delete buttons
  - Status filter tabs: All, Approved, Pending, Rejected, Draft with counts
  - Delete confirmation using shadcn AlertDialog
  - Delete mutation with toast and query invalidation
  - Edit navigates to list-item with product in viewData
  - View navigates to product detail
  - Empty states: no listings at all (with "List Your First Item" CTA) vs no results in filtered tab
  - Loading skeleton grid
  - "Add New Item" button in header navigates to list-item
  - Fetches products with ownerId filter
- Created ListItemPage.tsx: comprehensive product listing form
  - Zod schema validation with 17 fields (title, categoryId, description, condition, brand, model, purchaseYear, dailyPrice, weeklyPrice, securityDeposit, minRentalDays, maxRentalDays, stateId, cityId, pickupAddress, deliveryAvailable, deliveryFee, rentalRules, cancellationPolicy, ownerNotes)
  - react-hook-form + zodResolver integration
  - Controller for Select fields (category, condition, state, city) and Switch (delivery)
  - Required fields marked with red asterisk
  - 4 form sections: Basic Information, Pricing, Location, Images, Policies & Rules
  - Responsive 2-col layout on desktop, 1-col on mobile
  - State → City cascading select (city clears when state changes)
  - ₹ prefixed price inputs with IndianRupee icon
  - Delivery fee input appears when delivery switch is toggled
  - Image upload placeholder UI (disabled button, dashed border, upload icon)
  - Edit mode: populates form from viewData.product when navigating from MyListingsPage
  - Submit mutation calls api.createProduct or api.updateProduct based on mode
  - Success toast, navigates to my-listings on success
  - Back/Cancel buttons return to my-listings
  - Loading state for categories/states fetch
- Updated page.tsx: added switch cases for my-rentals, my-listings, list-item views

Stage Summary:
- 4 new components created across /src/components/rentloop/rentals/ and /src/components/rentloop/dashboard/
- MyRentalsPage: 7-tab rental management with countdown timers, status badges, contextual actions, dual-role fetching
- RentalDetailDialog: comprehensive rental detail with pricing breakdown, status timeline, payment history, extension management
- MyListingsPage: product grid with status filtering, CRUD actions, delete confirmation
- ListItemPage: 17-field form with zod validation, cascading selects, edit mode, image placeholder
- Navy (#0f172a) / emerald accent consistent with project design system
- ESLint passes clean (2 warnings: react-hook-form watch incompatible-library, expected)
- Dev server compiles and renders successfully

---
Task ID: 7
Agent: Main
Task: Create messaging, notifications, favorites, and admin dashboard UI components

Work Log:
- Read worklog.md, types/index.ts, store/index.ts, api.ts, chart.tsx, ProductCard.tsx, DashboardPage.tsx, MyListingsPage.tsx for context and coding patterns
- Created /src/components/rentloop/messaging/MessagesPage.tsx: messaging center
  - Left panel: conversation list with search, user avatars, last message preview, time (date-fns formatDistanceToNow), unread indicator dot
  - Right panel: selected conversation messages with sender avatars, navy bubble for sent messages, slate bubble for received, read status (Check/CheckCheck icons), timestamps
  - Message input at bottom with Send button (emerald), Enter key support
  - Empty state for no conversations: "No conversations yet. Start one from a product page." with Browse Marketplace CTA
  - Empty state for no chat selected: "Select a conversation" prompt
  - Responsive: mobile shows list OR chat (not both), back button on chat panel, viewport detection via resize event
  - useQuery for conversations and messages, useMutation for sendMessage with optimistic update
  - Auto-scroll to bottom on new messages via ref + useEffect
  - TanStack Query invalidation on message send (both messages and conversations queries)
- Created /src/components/rentloop/common/NotificationsPanel.tsx: notifications panel
  - Supports 'dropdown' and 'fullpage' modes via props
  - 14 notification type icons with unique icon, color, and background
  - Notification items show icon, title (bold if unread), message (line-clamp-2), relative time, unread dot
  - Click notification: marks as read via API, parses data JSON for navigation
  - Mark all as read button (fullpage header, dropdown inline)
  - Empty state with BellOff icon, AnimatePresence staggered entry animations
- Created /src/components/rentloop/dashboard/FavoritesPage.tsx: favorites page
  - Grid of favorited products (1/2/3/4 cols responsive) reusing ProductCard-style design
  - FavoriteCard subcomponent with gradient image, category icons, condition badges, ₹ pricing
  - Fill-red Heart toggle for remove with optimistic removal via onMutate
  - Empty state: "No favorites yet. Browse the marketplace and save items you like."
  - AnimatePresence with popLayout for smooth removal animation
- Created /src/components/rentloop/admin/AdminDashboardPage.tsx: admin analytics
  - 6 stat cards with AnimatedCounter (IntersectionObserver + rAF cubic ease)
  - Revenue BarChart (emerald bars) and Rental Status PieChart (donut, 8 colors) using recharts + ChartContainer
  - Recent rentals table and 4 quick link cards
- Created /src/components/rentloop/admin/AdminUsersPage.tsx: user management
  - Table (desktop) / Card (mobile) responsive layout with search, role/status filters, pagination
  - Actions: Verify, Suspend/Activate, Change Role via DropdownMenu
  - Expandable row details on desktop
- Created /src/components/rentloop/admin/AdminProductsPage.tsx: product management
  - Table (desktop) / Card (mobile) with search, status filter, Approve/Reject/Suspend/Reinstate actions
- Created /src/components/rentloop/admin/AdminRentalsPage.tsx: rental management
  - Table (desktop) / Card (mobile) with search, status filter, detail Dialog with pricing breakdown
  - Status update buttons in dialog
- Created /src/components/rentloop/admin/AdminDisputesPage.tsx: disputes management
  - Expandable dispute cards with resolution form (status select, notes textarea) for OPEN/UNDER_REVIEW
  - 6 status badge colors (OPEN=amber, UNDER_REVIEW=blue, RESOLVED=emerald, REJECTED=red)
- Updated page.tsx: added all 10 new view routes

Stage Summary:
- 8 new components created across messaging/, common/, dashboard/, admin/ directories
- MessagesPage: responsive split-panel messaging with optimistic send, auto-scroll, TanStack Query
- NotificationsPanel: dual-mode (dropdown/fullpage) with 14 type-specific icons and mark-all-read
- FavoritesPage: product grid with optimistic remove, AnimatePresence popLayout animations
- AdminDashboardPage: 6 animated stat cards, recharts BarChart + PieChart, recent rentals table, quick links
- AdminUsersPage: table/card responsive layout with expandable rows, role/status filters, pagination
- AdminProductsPage: table/card layout with approve/reject/suspend actions, pagination
- AdminRentalsPage: table/card layout with detail dialog, pricing breakdown, status updates
- AdminDisputesPage: expandable dispute list with resolution form for active disputes
- Navy (#0f172a) / emerald accent, ₹ pricing throughout
- ESLint passes clean (0 errors, 2 pre-existing react-hook-form watch warnings)
- Dev server compiles and renders successfully (HTTP 200)

---
Task ID: 8
Agent: Main
Task: Build AppShell (Header, Footer, Mobile Nav), wire everything together, fix bugs

Work Log:
- Created AppHeader.tsx: sticky header with RentLoop logo, nav links (Home, Explore, Dashboard), state picker dropdown, notification bell with unread count and dropdown panel, user menu dropdown (Dashboard, My Rentals, My Listings, Favorites, Messages, Admin Panel, Logout), mobile hamburger menu via Sheet, login/signup buttons for unauthenticated users
- Created AppFooter.tsx: 4-column footer (Brand, For Renters, For Owners, Support) with nav links, email/phone, social, copyright
- Created MobileNav.tsx: 5-tab bottom navigation (Home, Explore, List, Rentals, Profile) with active state highlighting, auth gating
- Created ErrorBoundary.tsx: class component error boundary with error message display and retry button
- Updated page.tsx: complete SPA router with all 19 views, header/footer on non-landing views, ErrorBoundary wrapping, auth check on mount, reference data fetching (states, categories)
- Updated layout.tsx: RentLoop metadata (title, description, keywords, OpenGraph, Twitter cards)
- Fixed API response format issues: states, categories, rentals, conversations, messages, notifications, disputes APIs were wrapping arrays in objects ({ states: [...] }) but frontend expected plain arrays
- Fixed products API: added state/city includes, fixed sort name mapping (price_asc/price_desc), fixed Prisma orderBy for recommended sort (array format)
- Fixed ProductDetailPage: added missing useMemo import
- Fixed page.tsx: missing closing backtick in template literal
- Browser verified: landing page, marketplace, product detail, login, dashboard all working

Stage Summary:
- Full SPA with client-side routing via Zustand store
- Consistent navy (#0f172a) / emerald design system
- Responsive design with mobile bottom nav
- Error boundaries for graceful error handling
- All core flows verified in browser

---
Task ID: 9
Agent: Main
Task: Fix Rental Calculator section - same-day date selection causing 0-day rental

Work Log:
- Analyzed user screenshot showing Rental Calculator with disabled Rent Now button, no pricing breakdown, no validation feedback
- Identified root cause: end date calendar used `disabled={{ before: startDate || today }}` which allowed picking same day as start date (react-day-picker `before` is exclusive, so startDate itself was selectable)
- Added `addDays` import from date-fns
- Changed end date calendar disabled to `addDays(startDate!, product?.minRentalDays ? product.minRentalDays : 1)` - this enforces minimum 1-day (or product's minRentalDays) by disabling all dates up to and including the minimum required start date
- Added `dateValidationError` useMemo that validates: days > 0, respects minRentalDays and maxRentalDays from product
- Added `isDateValid` derived state used consistently across Rent Now button, coupon input, and Apply button
- Added red validation error banner (with XCircle icon) that appears when both dates are selected but invalid
- Improved Rent Now button disabled text: "Select Start Date" → "Select End Date" → error message → "Rent Now"
- Updated coupon input and Apply button to use `isDateValid` instead of `rentalCalc.days <= 0`
- Updated `handleRentNow` to check `!isDateValid` instead of `rentalCalc.days <= 0`

Stage Summary:
- End date calendar now prevents same-day selection and respects product's minRentalDays
- Clear red validation error shown when dates are invalid (e.g. "End date must be after start date.")
- Rent Now button shows contextual disabled text (Select Start Date / Select End Date / validation error)
- Coupon input properly disabled when dates are invalid
- Browser verified: Aug 20 start → Aug 20 DISABLED in end calendar, Aug 21+ enabled, pricing breakdown appears, green Rent Now button active
