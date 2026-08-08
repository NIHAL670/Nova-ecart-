# Deployment Guide — Nova Cart

## 1. Local development

```bash
npm install && npm run setup        # install both apps
cp .env.example backend/.env
cp .env.example frontend/.env.local
cd backend && npm run seed          # seed admin, products, coupon
npm run dev                          # backend :5000 + frontend :3000
```

Backend `.env` essentials: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`.
Frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`.

> Without SMTP credentials the app uses a dev "logger" transport and returns the OTP code in the API response — see the `devCode` field on register/forgot-password, so registration still works.

---

## 2. Docker Compose (single-host demo / small prod)

```bash
cp .env.example backend/.env         # fill real values
docker compose up --build
```

Brings up **MongoDB + Redis + Backend (:5000) + Frontend (:3000)**. The backend image runs `seed` then `start` automatically.

## 3. Production Docker images (individually)

```bash
# Backend
docker build -t novacart-backend ./backend
docker run -p 5000:5000 --env-file backend/.env novacart-backend

# Frontend (Next.js standalone)
docker build -t novacart-frontend ./frontend
docker run -p 3000:3000 --env-file frontend/.env.local novacart-frontend
```

---

## 4. Recommended hosting topology

| Component    | Suggested host | Notes |
|---|---|---|
| MongoDB      | MongoDB Atlas | Free tier; set auto-index/dev only in dev |
| Redis        | Upstash / Redis Cloud (optional) | Cache; `REDIS_ENABLED` guards fallback |
| Backend      | Render or Railway (Docker) | One service, health check `/health` |
| Frontend     | Vercel (Next.js) | Set env vars in the dashboard |
| Images       | Cloudinary | If unset, falls back to local `/uploads` disk |
| Email        | Resend / SES / Mailgun (SMTP) | OTP + password reset |

### Vercel (frontend) env vars
- `NEXT_PUBLIC_API_URL` → your backend URL (`https://api.yourdomain.com/api/v1`)
- `NEXT_PUBLIC_SITE_URL` → your frontend URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

> `next.config.mjs` includes a rewrite so `/api/v1/*` can proxy to the backend if you prefer not to CORS.

### Backend env vars (production)
- `NODE_ENV=production`, `PORT=5000`
- `MONGODB_URI`, `REDIS_URL`, `REDIS_ENABLED`
- `CORS_ORIGIN` → your frontend origin(s), comma-separated
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` → strong random values (≥32 chars); set `COOKIE_SECURE=true` (HTTPS)
- `CLOUDINARY_*` (uploads), `SMTP_*` + `CLIENT_URL` (emails)
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`

---

## 5. Payment webhooks

- **Stripe** → `POST https://api.yourdomain.com/api/v1/payments/webhook/stripe`
  - Listen for `payment_intent.succeeded` and `payment_intent.payment_failed`.
  - Put the Webhook Signing Secret in `STRIPE_WEBHOOK_SECRET`.
  - In dev, use the Stripe CLI: `stripe listen --forward-to localhost:5000/api/v1/payments/webhook/stripe`.
- **Razorpay** → `POST https://api.yourdomain.com/api/v1/payments/webhook/razorpay`
  - Enable the `payment.captured`/`payment.failed` events; set `RAZORPAY_WEBHOOK_SECRET` (used as the HMAC key).

---

## 6. Production hardening checklist

- [ ] `NODE_ENV=production`, `COOKIE_SECURE=true` (HTTPS)
- [ ] Strong, unique JWT secrets; rotate periodically
- [ ] MongoDB Atlas IP allowlist + strong credentials
- [ ] HTTPS everywhere (Vercel auto / Caddy or NLB in front of Node)
- [ ] Cloudinary configured (local uploads disabled in prod)
- [ ] `REDIS_ENABLED` on for caching
- [ ] Stripe/Razorpay live keys + webhooks verified
- [ ] Rate limiting already applied; raise limits only if the demo needs it
- [ ] Add `AUTH` variants to `.env.production` if needed; don't commit `.env` files

## 7. CI/CD

`.github/workflows/ci.yml` runs on every PR/push to `main`:
- Backend: `npm ci` → typecheck → lint → test → build
- Frontend: `npm ci` → typecheck → lint → test → build (`next build` validates all routes)

Add deploy steps on `main` (e.g., Vercel `vercel deploy --prod` for frontend, `docker buildx` + `ghcr.io` push for backend).