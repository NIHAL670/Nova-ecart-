# Frontend Conventions (for contributors + build agents)

Read this before adding pages/components. Every new file goes under `frontend/src/`.

## Paths / aliases
- Import alias `@/` → `src/`. Always use `@/...` (never relative) for app imports.
- App router pages live in `src/app/**/page.tsx`. Dynamic segments use `[slug]`.

## Stack (already installed)
Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind v3 · framer-motion · TanStack Query v5 · Zustand v5 · react-hook-form + zod · axios · lucide-react · sonner · recharts (v2, admin charts) · @stripe/stripe-js.

## Golden rules
1. Everything interactive → `'use client'`.
2. No `any[]` where a type exists. Use types from `@/types`.
3. Data fetching with TanStack Query (`useQuery`/`useMutation`) using service functions + `queryKeys`.
4. Server state (auth/cart/wishlist/theme) → Zustand stores (persisted). Never put API-fetched lists into stores.
5. Styling with Tailwind + `cn()` from `@/lib/utils` (never raw `clsx`).
6. Images: `next/image` with `fill` inside a `relative` sized box; remote hostnames already allowlisted in `next.config.mjs`.
7. Error → `sonner` `toast.*`. Never `alert()`.

## Existing building blocks (verify these paths before writing new ones)

### UI (src/components/ui/)
`button` (variants: default/outline/ghost/secondary/destructive/soft/link; sizes: default/sm/lg/icon/icon-sm), `input`, `textarea`, `label`, `badge` (variants: default/secondary/outline/success/warning/destructive/sale), `card`(+Header/Title/Description/Content/Footer), `skeleton`, `separator`, `dialog`, `sheet` (side: right/left; use for cart drawer), `dropdown-menu`, `select`, `tabs`, `tooltip`, `avatar`, `switch`, `checkbox`, `radio-group`, `progress`, `scroll-area`, `accordion`, `popover`, `table`(+Header/Body/Row/Head/Cell/Caption), `alert-dialog`, `form` (FormProvider wrapper exposing Form/FormItem/FormLabel/FormField/FormMessage/FormDescription; pair with react-hook-form).

### Common components (`@/components/common/`)
- `Logo`, `ThemeToggle`, `Price` (price/compareAtPrice/currency/size), `Rating` (value/count/size/showCount), `QuantityStepper` (value/onChange/min/max/size), `EmptyState` (icon/title/description/action), `SectionHeading` (eyebrow/title/description/link/align), `CartDrawer` (self-wires to `useUiStore.isCartOpen`), `SearchOverlay`, `UserMenu`, `Footer`.

### Product components (`@/components/product/`)
- `ProductImage` (src/alt/priority/className/sizes), `ProductCard` (product/index/priority), `ProductGrid` (products/columns/priority/className → columns 2|3|4|5), `ProductGridSkeleton`/`ProductCardSkeleton`, `ProductsCarousel` (products), `WishlistButton` (productId), `ReviewsList` + `ReviewForm` (build in the product-details file; see services).

### Stores (`@/store/`)
- `useAuthStore`: user, accessToken, status, login/logout/refreshProfile/setAuth/setUser, selectors `selectIsAuthenticated`,`selectIsAdmin`.
- `useCartStore`: items (CartItem[]), add(product, qty), remove(productId, variant), updateQuantity(productId, qty, variant), clear, setItems; selectors `selectCartCount`,`selectCartSubtotal`.
- `useWishlistStore`: ids(string[]), toggle/setIds/remove/clear/has.
- `useUiStore`: isCartOpen/openCart/closeCart, isSearchOpen/openSearch/closeSearch.
- `useRecentlyViewedStore`: items/add/clear.
- `useNotificationStore` (optional).

### Services (`@/services/`) & API (`@/lib/api.ts`)
- `client` (axios), `get`/`post`/`patch`/`del<T>` (unwraps `{data}`), `getWithMeta<T>` for paginated (`{data, meta}`). `ApiError` already wraps backend errors; use `getErrorMessage(err)`.
- `auth.service.ts`: register/verifyEmail/resendOtp/login/logout/forgotPassword/resetPassword/fetchMe.
- `catalog.service.ts`: fetchProducts(params)→{items,meta}, fetchProductBySlug, fetchProductById, fetchRelated, fetchFeatured/BestSellers/Latest/Offers/Trending, fetchSuggestions, fetchCategories, fetchCategoryTree.
- `review.service.ts`: fetchReviews(productId,page,sort)→{items,meta,avgRating,count,distribution}, createReview, updateReview, deleteReview.
- `wishlist.service.ts`: fetchWishlist/toggleWishlist/removeFromWishlist.
- `address.service.ts`: fetchAddresses/createAddress/updateAddress/deleteAddress/setDefaultAddress.
- `order.service.ts`: validateCart(items,couponCode), checkout({items,shippingAddressId,paymentMethod,couponCode,notes})→CheckoutResult, fetchMyOrders(page), fetchOrderById, fetchOrderByNumber, cancelOrder.
- `coupon.service.ts`: validateCoupon(code,subtotal).
- `user.service.ts`: updateProfile/changePassword/uploadAvatar.
- `admin.service.ts`: fetchDashboard/fetchRevenueTrend/fetchOrderStatusBreakdown/fetchPaymentMethodBreakdown/fetchTopProducts/fetchLowStock/fetchSalesReport/adminFetchOrders/adminUpdateOrderStatus/adminListUsers/adminToggleUser/adminDeleteUser/adminFetchCoupons/adminCreateCoupon/adminUpdateCoupon/adminDeleteCoupon/adminFetchProductsAll/adminCreateProduct/adminUpdateProduct/adminDeleteProduct/adminFetchCategoriesAll/adminCreateCategory/adminUpdateCategory/adminDeleteCategory.

### Query keys: `@/constants` → `queryKeys`, `storageKeys`, `api`, `orderStatusStyles`, `paymentMethodLabels`, `ORDER_STATUS_FLOW`.
### Utils: `@/lib/utils.ts` → `cn`, `formatCurrency`, `formatCompact`, `formatDate`, `formatDateTime`, `timeAgo`, `truncate`, `avatarUrl`, `round2`.
### Hooks: `@/hooks/useDebounce`, `useMediaQuery`/`useIsMobile`, `useInView`, `useLockBody`.

## Payment flow (checkout page)
- `checkout()` returns `{order, gateway, ...}` (stripe → clientSecret; razorpay → razorpayOrderId/amount/currency/keyId; cod → order).
- Stripe: load `@stripe/stripe-js` with `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and confirm card payment using the returned clientSecret.
- Razorpay: open checkout popup; on success redirect to `/order-success?order=<id>&ref=<rzpPaymentId>`.
- COD: redirect to `/order-success?order=<id>`.
- Always construct the cart optimistically in `useCartStore`; use `validateCart` to fetch the authoritative price breakdown.

## Routing
- Products: `/products` (listing), `/products/[slug]` (details).
- Checkout must redirect to `/` if cart empty; requires login (`useAuthStore`).
- `/profile`, `/orders`, `/orders/[id]`, `/wishlist` require login.
- `/admin` subtree requires role `admin` (client-side guard component).