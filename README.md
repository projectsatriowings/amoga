# Amoga E-Commerce Platform

Amoga is a unified luxury e-commerce platform encompassing three curated houses:
1. **Gourmet Food** (`/food`) — Organic stone-ground delicacies, herbal infusions, pure honey, and regional podis.
2. **Heritage Sarees** (`/sarees`) — Handloom Kanchipuram silks, Banarasi brocades, tissue silks, and antique zari weaves.
3. **Silver Jewellery** (`/jewellery`) — Hallmarked 925 sterling silver rings, necklaces, cuffs, and earrings.

---

## Architecture Overview

* **Frontend**: React 19, Vite 8, Tailwind CSS, Zustand, Framer Motion, React Router 7.
* **Backend**: Node.js, Express 4, Prisma ORM 6, Zod, Helmet, Express Rate Limit.
* **Database**: PostgreSQL (Neon serverless cloud pooler).

```
AMOGA/
├── src/                         # Frontend Application (Phases 1-6)
│   ├── app/                     # React Router configurations
│   ├── components/              # Shared Shell, Headers, Footers, UI primitives
│   ├── features/                # Collection storefronts (food, sarees, jewellery, cart, checkout)
│   ├── hooks/                   # useProducts, useProductDetail API integration hooks
│   ├── services/                # apiClient, productsApi, checkoutApi
│   └── store/                   # Zustand unified cart and checkout state
├── server/                      # Backend API Server (Phase 7)
│   ├── src/
│   │   ├── config/              # Environment validation & Prisma singleton
│   │   ├── controllers/         # Health, Collections, Products, Checkout, Orders
│   │   ├── middleware/          # Security headers, rate limiting, error handling
│   │   ├── routes/              # Express API routers
│   │   ├── schemas/             # Zod input validation schemas
│   │   ├── services/            # Authoritative pricing & order transactions
│   │   └── utils/               # Order reference generator & guest token hashers
│   ├── prisma/
│   │   ├── schema.prisma        # Normalized schema (Collections, Products, Variants, Orders)
│   │   ├── migrations/          # Versioned SQL migrations
│   │   └── seed.js              # Idempotent database seeder & reconciliation reporter
│   ├── tests/                   # Automated API, database, and transaction test suite
│   ├── package.json
│   └── .env.example
├── .env.example
├── test-phase6.js               # Frontend pricing safeguards & checkout unit tests
├── test-routes.js               # 53-route HTTP verification suite
├── vite.config.js               # Vite config with /api reverse proxy to port 5001
└── package.json
```

---

## Getting Started

### 1. Prerequisites
* **Node.js**: v20+ LTS (Tested on v24.19.0)
* **PostgreSQL**: PostgreSQL 15+ or Neon Database Connection URL

### 2. Environment Variables Configuration
Copy `.env.example` to `server/.env`:
```env
DATABASE_URL="postgresql://username:password@ep-host.aws.neon.tech/neondb?sslmode=require"
PORT=5001
NODE_ENV=development
FRONTEND_ORIGIN="http://localhost:5173"
GUEST_ORDER_TOKEN_SECRET="your-secure-secret-salt"

# Phase 8 Payment Architecture
PAYMENT_PROVIDER="test"
PAYMENT_MODE="test"
PAYMENT_CURRENCY="INR"
TEST_PAYMENT_SECRET="your-test-hmac-secret"

# Future Live Provider Placeholders (populated once provider is approved)
# RAZORPAY_KEY_ID=""
# RAZORPAY_KEY_SECRET=""
# RAZORPAY_WEBHOOK_SECRET=""
```

### 3. Database Migration & Repeatable Seeding
Apply database migrations and seed catalogue products from existing frontend data:
```bash
# Push schema state to database
npm run db:push

# Generate latest Prisma client
npm run db:generate

# Seed approved catalogue products (reconciled across Food, Sarees, and Jewellery)
npm run db:seed
```

### 4. Running the Development Environment
Run backend API server:
```bash
npm run server:dev
# Backend starts at http://localhost:5001
```

Run frontend Vite dev server (in another terminal):
```bash
npm run dev
# Frontend starts at http://localhost:5173 (with /api proxy to :5001)
```

---

## Phase 8: Provider-Independent Payment Architecture

Amoga utilizes a modular, decoupled payment architecture designed to support future payment gateway integration (such as Razorpay, Cashfree, or Stripe India) without modifying frontend storefronts or database order structures.

```
React/Vite Checkout UI
       │
       ▼
Frontend checkoutApi
       │
       ▼
Express Payment Routes (/api/payments)
       │
       ▼
Payment Service Orchestrator
       │
   ┌───┴────────────────────────┐
   ▼                            ▼
Development Test Adapter    Future Gateway Adapter (Razorpay/Cashfree/Stripe)
   │                            │
   └───────────┬────────────────┘
               ▼
   Prisma Atomic Transactions & Neon PostgreSQL
               │
        ┌──────┴──────┐
        ▼             ▼
   orders table   payments table & payment_events table
```

### State Machines

#### 1. Order Status (`OrderStatus`)
* `PENDING_PAYMENT`: Initial state when order record is created prior to payment completion.
* `CONFIRMED`: Terminal purchase state entered immediately upon cryptographic payment verification or verified webhook receipt.
* `PROCESSING`: Merchant fulfillment packaging initiated.
* `DISPATCHED`: Courier consignment handed over.
* `DELIVERED`: Final receipt confirmed.
* `CANCELLED`: Order aborted prior to dispatch.

#### 2. Payment Attempt Status (`PaymentStatus`)
* `CREATED`: Attempt initialized.
* `PENDING`: Awaiting customer action or gateway response.
* `AUTHORIZED`: Card funds held (if capture deferred).
* `SUCCEEDED`: Verified and captured. Triggers order transition to `CONFIRMED`.
* `FAILED`: Declined or signature tampered. Preserves order and cart for safe customer retry.
* `CANCELLED`: Dismissed by customer.
* `EXPIRED`: Gateway timeout reached.
* `REFUNDED` / `PARTIALLY_REFUNDED`: Post-purchase adjustments.

### Provider Selection Status
* **Status**: **Undecided** by client.
* **Active Adapter**: `TestPaymentProvider` (development simulation only).
* **Safety Restriction**: The test adapter cannot be activated in production (`NODE_ENV === 'production'` unconditionally halts server startup if `PAYMENT_PROVIDER === 'test'`).

---

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health and PostgreSQL connectivity check |
| `GET` | `/api/collections` | List active Amoga collections |
| `GET` | `/api/products` | Query products with filters (`collection`, `category`, `q`, `sort`, `page`, `limit`) |
| `GET` | `/api/products/:collection/:slug` | Resolve product details, gallery, specifications, and variants |
| `POST` | `/api/checkout/validate` | Authoritatively validate cart line items, reject unpriced products, and recalculate totals |
| `POST` | `/api/orders` | Create persistent database order in an atomic transaction with idempotency protection |
| `GET` | `/api/orders/:orderReference` | Retrieve customer order details protected by `x-guest-access-token` header |
| `POST` | `/api/payments/create-order` | Create or reuse payment attempt for an order (authoritative integer-paise amount) |
| `POST` | `/api/payments/verify` | Cryptographically verify payment callback signature and transition order to `CONFIRMED` |
| `POST` | `/api/payments/webhook` | Ingest and deduplicate gateway webhook events with raw-body signature verification |
| `GET` | `/api/payments/:paymentReference/status` | Protected payment attempt status check using `x-guest-access-token` |
| `POST` | `/api/payments/test-simulate` | Development-only test simulation helper (disabled in production) |

---

## Security, Idempotency & Webhook Verification

1. **Integer Paise Financial Precision**: All internal pricing calculations use exact integer paise (`1 INR = 100 paise`), eliminating floating-point drift.
2. **Timing-Safe Cryptographic Verification**: Signature and guest access token comparisons use constant-time `crypto.timingSafeEqual` with byte length guards.
3. **Session-Scoped Guest Access**: Capability tokens are stored in `sessionStorage` and transmitted via `x-guest-access-token` headers, never leaked in URLs.
4. **Idempotent Webhook Deduplication**: Webhooks are recorded in `payment_events` with `@@unique([provider, providerEventId])`. Duplicate events return immediate acknowledgement without duplicate state transitions.
5. **Raw Body Preservation**: Express preserves the exact unparsed body buffer (`req.rawBody`) for bit-for-bit HMAC signature verification.

---

## Running Automated Tests

Run the full end-to-end test suite:
```bash
# Run server test suite (26 passing tests covering security, pricing, orders, and payments)
npm --prefix server test

# Run frontend pricing safeguards & checkout unit tests
node test-phase6.js

# Run 53-route HTTP verification suite
node test-routes.js

# Run live payment lifecycle integration check
node scratch/verify_phase8_payments_flow.js
```

Run code linting:
```bash
npm run lint
```

Run production build:
```bash
npm run build
```

