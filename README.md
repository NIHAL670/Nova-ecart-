# Nova Cart — Production-Ready E-Commerce Platform

A full-stack e-commerce storefront (Premium UI) + admin dashboard + REST API + payment integration, built for the **Adaption hackathon**.

> **Frontend:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · TanStack Query · Zustand · React Hook Form + Zod
> **Backend:** Node.js · Express · TypeScript · MongoDB (Mongoose) · JWT · Bcrypt · Cloudinary · Redis · Nodemailer · Stripe + Razorpay + COD

- **Verified:** Backend `tsc` build clean · Frontend `next build` clean (26 routes) · Backend tests (20) + Frontend tests (12) green.

---

## 📁 Architecture

```
├── .github/workflows/ci.yml      # Typecheck · lint · test · build (both apps)
├── docker-compose.yml            # mongo + redis + backend + frontend
├── backend/   # Express REST API (feature-based)
│   └── src/
│       ├── config/     env, db, redis, cloudinary, smtp, stripe, razorpay
│       ├── models/     User, Product, Category, Review, Order, Coupon, Wishlist, Address, Otp
│       ├── controllers/ routes/  validators/  services/
│       ├── middleware/ auth, authorize, validate (zod), errorHandler, rateLimiter
│       ├── types/ enums + express augmentation
│       ├── utils/      ApiError, ApiResponse, ApiFeatures, tokens, slugify, upload, email
│       └── scripts/seed.ts
└── frontend/  # Next.js 15 storefront + admin (feature-based)
    └── src/
        ├── app/            # pages: landing, products, cart, checkout, orders, auth, profile, admin/**
        ├── components/     # ui/ (shadcn) · common/ · product/ · cart/ · checkout/ · order/ · admin/ · auth/
        ├── store/          # zustand: auth, cart, wishlist, ui, recentlyViewed, notifications
        ├── services/       # typed API layer (axios)
        ├── providers/ hooks/ lib/ utils/ constants/ types/
```

---

## 🚀 Quick Start (local)

**Requirements:** Node 20+, MongoDB (local or Atlas).

```bash
# 1. Install deps (root script installs both apps)
npm install
npm run setup          # == `cd backend && npm i` + `cd frontend && npm i`

# 2. Configure environment
cp .env.example backend/.env      # then fill in real values (Mongo URI, secrets)
cp .env.example frontend/.env.local   # NEXT_PUBLIC_API_URL, etc.

# 3. Build + seed the database (creates admin + demo products + a coupon)
cd backend && npm run seed

# 4. Run both dev servers (backend :5000, frontend :3000)
npm run dev
```

Open **http://localhost:3000**.

**Default admin** (auto-created on boot): `admin@novacart.com` / `Admin@12345` (set via `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env`).

**Demo coupon:** `WELCOME10` (10% off).

---

## 🔐 Authentication

- **Access token**: short-lived JWT (15m), sent via `Authorization: Bearer`.
- **Refresh token**: long-lived JWT (7d) in a **HttpOnly cookie**, rotated on every refresh; reuse is detected and forces logout.
- **OTP email verification** (signup) + **forgot/reset password** (6-digit OTP).
- **Role-based access** — `admin` vs `customer`; all `/admin/**` and admin APIs are guarded.
- Passwords are bcrypt-hashed; sensitive fields are never serialized.

---

## 🛍️ Features

**Storefront** — hero, categories (tree), featured/trending/best-sellers/offers, testimonials, newsletter; product listing with search/filter/sort/price-range/pagination; product details with gallery, reviews + ratings distribution, variants, related items, recently-viewed; wishlist; search suggestions with debounce; cart drawer, persistent guest cart.

**Commerce** — server-authoritative cart validation, coupons (percentage/flat, scoped), tax + free-shipping tiers, address book with defaults, **Stripe** card payments, **Razorpay**, **Cash on Delivery**, webhooks with signature verification, order tracking timeline, cancellation with stock restore.

**Admin** — dashboard analytics (revenue trend, order/payment breakdowns, low-stock alerts), product/category/coupon/user/order CRUD, inventory management, sales reports (Recharts).

**UX** — glassmorphism, dark/light mode, skeletons, page transitions, micro-interactions, fully responsive.

---

## 🔌 API Overview (`/api/v1`)

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/register` · `/auth/register/verify-email` · `/auth/register/resend-otp` | public |
| POST | `/auth/login` · `/auth/refresh-token` · `/auth/forgot-password` · `/auth/reset-password` | public |
| GET | `/auth/me` · `/users/profile` · `/users/password` | auth |
| GET | `/products` `/products/featured` `/products/slug/:slug` `/products/suggestions` | public |
| GET | `/categories` `/categories/tree` `/reviews` · POST `/reviews` | mixed |
| GET/POST | `/wishlist` · `/addresses` · `/orders` `/orders/cart/validate` `/orders/checkout` | auth |
| GET | `/coupons/validate` | public |
| GET|PATCH|DELETE | `/admin/dashboard` `/admin/orders` `/admin/users` `/admin/reports/sales` … | admin only |
| POST | `/payments/webhook/stripe` `/payments/webhook/razorpay` | gateway webhooks |

See `frontend/CONVENTIONS.md` for the frontend data contract, or the source in `backend/src/routes` for each route.

---

## 🧪 Testing

```bash
npm run test           # root → runs backend + frontend tests
cd backend  && npm run test
cd frontend && npm run test
```

Backend: Vitest unit tests (tokens, error envelope, slugify, OTP, API features query-builder). Frontend: Vitest + Testing Library (store logic, formatters).

---

## ☁️ Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for: local run, Docker Compose, production Docker images, Vercel (frontend) + Render/Railway/EC2 (backend), MongoDB Atlas, environment checklist, and Stripe/Razorpay webhook setup.

---

## 🧹 Code quality

TypeScript strict · ESLint · Prettier · SOLID-ish separation (controllers thin, services carry logic) · feature-based folders · absolute imports (`@/`) · Server Components where possible, client colocated · memoization · lazy-loading below-the-fold sections · image optimization · SEO (`sitemap.ts`, `robots.ts`, metadata).