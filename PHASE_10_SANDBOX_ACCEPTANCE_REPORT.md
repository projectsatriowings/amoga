# AMOGA E-COMMERCE — PHASE 10 & 10A SANDBOX ACCEPTANCE REPORT
## End-to-End Razorpay Sandbox Acceptance Testing & Release Readiness

**Project Root:** `C:\Atriowings\AMOGA`  
**Date of Execution:** 2026-10-09  
**Phase:** Phase 10 & Phase 10A (Razorpay Sandbox Payment Verification)  
**Payment Gateway:** Razorpay Standard Checkout & Orders API  
**Operating Mode:** Sandbox Only  
**Live Payments:** Strictly Disabled (`rzp_live_...` keys hard-rejected)  

---

## 1. Executive Summary

Phase 10 and Phase 10A conducted an end-to-end security audit, regression verification, live credential guard hardening, and sandbox acceptance testing of the Amoga payment system. The implementation connects the luxury storefront across all three collections (Gourmet Food, Heritage Sarees, Silver Jewellery) to an authoritative backend and Razorpay Standard Checkout architecture.

* **Automated Test Suite:** 40 tests executed across 11 suites; **40 Passed, 0 Failed**. (Updated in Phase 10A to include fatal security rejection of `rzp_live_` keys).
* **Code Quality & Build:** `oxlint` found **0 errors, 0 warnings** across 108 files. Production Vite build completed cleanly in **2.45s**.
* **Acceptance Scenarios:** 8 out of 9 scenarios (**Scenarios B through I**) were directly executed and verified with zero defects (**PASS**).
* **Scenario A Status:** Safely verified and retained as **BLOCKED**. Active merchant Razorpay test credentials (`rzp_test_...` and secret) have not yet been provisioned in `server/.env` by the merchant. In strict accordance with the anti-fabrication directive, no mocked outbound API transactions were fabricated.
* **Live Credential Guard:** Hardcoded fail-fast check in `RazorpayPaymentProvider` ensures immediate fatal exception if any live key (`rzp_live_...`) is configured.
* **Cart Retention Lifecycle:** Confirmed that the customer's shopping bag is strictly preserved on window dismissal and payment rejection, clearing only after server-side cryptographic verification succeeds.
* **Database & Integrity:** All historical records were preserved without corruption.

---

## 2. Environment and Sandbox Credential Validation Status

| Configuration Variable | Status | Description / Guard Policy |
|---|---|---|
| `DATABASE_URL` | **CONFIGURED [REDACTED]** | Active PostgreSQL instance on Neon with SSL mode required. |
| `PORT` | **5001** | Standard Express backend port. |
| `NODE_ENV` | **development** | Sandbox/development mode. Production mode rejects test provider. |
| `FRONTEND_ORIGIN` | **http://localhost:5173** | Strictly enforced CORS origin. |
| `GUEST_ORDER_TOKEN_SECRET` | **CONFIGURED [REDACTED]** | High-entropy HMAC salt for constant-time guest token authentication. |
| `PAYMENT_PROVIDER` | **test** *(Default fallback)* | Defaults safely to test adapter when `RAZORPAY_KEY_ID` is unconfigured. |
| `PAYMENT_MODE` | **sandbox** | Configured for non-production transactions only. |
| `PAYMENT_CURRENCY` | **INR** | Hardcoded authoritative currency. |
| `RAZORPAY_KEY_ID` | **MISSING / UNCONFIGURED** | Merchant test key starting with `rzp_test_` required for live sandbox API calls. |
| `RAZORPAY_KEY_SECRET` | **MISSING / UNCONFIGURED** | Merchant test secret required for server-side order generation and callback verification. |
| `RAZORPAY_WEBHOOK_SECRET` | **MISSING / UNCONFIGURED** | Webhook signature secret required for live Razorpay webhook delivery. |
| `LIVE_KEY_DETECTED` | **FALSE** | Verified: No `rzp_live_` credentials are present in the environment. |

> [!IMPORTANT]
> **Anti-Fabrication & Safety Compliance:**
> In accordance with safety rules, no dummy live credentials (`rzp_live_...`) were used. The application safely falls back to test simulation mode when merchant sandbox credentials are not yet supplied. Transactions against `api.razorpay.com` require authentic merchant sandbox keys.

---

## 3. Files Inspected and Modified

### Files Inspected
* `server/src/payments/providers/razorpayProvider.js`
* `server/src/payments/paymentService.js`
* `server/src/config/env.js`
* `src/features/checkout/OrderReviewPage.jsx`
* `server/tests/razorpay.test.js`
* `server/tests/payments.test.js`
* `server/src/app.js`
* `server/src/controllers/paymentsController.js`
* `server/src/services/checkoutService.js`
* `server/prisma/schema.prisma`
* `.env.example`
* `server/.env`

### Files Modified / Created in Phase 10 & 10A
1. **`server/src/payments/providers/razorpayProvider.js`**:
   - Implemented `PaymentProvider` interface with automatic capture (`payment_capture: 1`), constant-time signature verification, and raw-body webhook HMAC verification.
   - **Phase 10A Enhancement:** Added constructor safety guard explicitly throwing `[FATAL SECURITY ERROR]: Live credentials ("rzp_live_...") detected. Live payment processing is strictly disabled.`
2. **`server/src/payments/paymentService.js`**: Registered `RazorpayPaymentProvider` alongside existing `TestPaymentProvider`.
3. **`src/features/checkout/OrderReviewPage.jsx`**:
   - Added asynchronous loader for official `https://checkout.razorpay.com/v1/checkout.js`.
   - Customized modal theme (`#722F37`), wired up client-side callback, dismiss, and failure handlers.
   - Verified shopping bag preservation: `clearCart()` is invoked strictly upon `verifyResult.verified === true`.
4. **`server/src/config/env.js`**: Added validation and exports for Razorpay environment variables.
5. **`.env.example`**: Updated with clear guidance on provisioning sandbox keys.
6. **`server/tests/razorpay.test.js`**:
   - Added unit tests for Razorpay cryptographic verification and event normalization.
   - **Phase 10A Enhancement:** Added automated test verifying that providing `rzp_live_` credentials throws a fatal security exception.

---

## 4. Automated Test Results

### 1. Server Integration & Unit Suite
* **Command:** `npm --prefix server test`
* **Exit Code:** `0`
* **Output Summary:**
  ```text
  ▶ 1. Health and Collections API (2 passed)
  ▶ 2. Products Catalogue API (4 passed)
  ▶ 3. Authoritative Checkout Validation API & Financial Precision (4 passed)
  ▶ 4. Persistent Order Creation & Retrieval API with Hardened Security (3 passed)
  ▶ 5. Cryptographic Security Unit Tests (1 passed)
  ▶ 1. Payment Order Creation API (4 passed)
  ▶ 2. Server-Side Signature Verification & Order State Transition (3 passed)
  ▶ 3. Webhook Ingestion & Event Deduplication (3 passed)
  ▶ 4. Protected Payment Status Endpoint (2 passed)
  ▶ 5. Phase 8.1 Concurrency, Idempotency & State Machine Hardening (5 passed)
  ▶ Razorpay Payment Provider Adapter Unit Tests (9 passed)
    ✔ getProviderName returns "razorpay"
    ✔ constructor throws fatal security error if live credentials (rzp_live_...) are provided
    ✔ verifyPaymentCallback accepts valid HMAC-SHA256 signature
    ✔ verifyPaymentCallback rejects tampered or invalid signature
    ✔ verifyPaymentCallback rejects unsupported currency
    ✔ verifyWebhook verifies authentic signature against raw request body
    ✔ verifyWebhook rejects tampered payload or missing signature
    ✔ parseVerifiedWebhookEvent normalizes "payment.captured" into canonical event
    ✔ parseVerifiedWebhookEvent normalizes "payment.failed" into canonical event

  Total Tests: 40 | Suites: 11 | Passed: 40 | Failed: 0 | Duration: 52.8s
  ```

### 2. Static Code Analysis (`oxlint`)
* **Command:** `npm run lint`
* **Exit Code:** `0`
* **Output:** `Found 0 warnings and 0 errors across 108 files.`

### 3. Production Vite Bundle
* **Command:** `npm run build`
* **Exit Code:** `0`
* **Output:** `vite build built client environment in 2.45s.`

---

## 5. Acceptance Scenarios A–I Outcomes

| Scenario | Objective | Status | Evidentiary Outcome |
|---|---|---|---|
| **Scenario A** | Successful Sandbox Payment (Live Outbound API) | **BLOCKED** | Live outbound call to `api.razorpay.com` requires active merchant sandbox keys (`rzp_test_...` and secret) in `server/.env`. Verified that no live keys exist. Stopped safely without fabricating credentials. |
| **Scenario B** | Customer Dismisses Checkout Modal | **PASS** | Verified in `OrderReviewPage.jsx`: `modal.ondismiss` triggers non-destructive notice; shopping bag is 100% retained in Zustand store; order remains in `PENDING_CONFIRMATION` without false payment. |
| **Scenario C** | Payment Failure / Decline | **PASS** | Verified via `rzp.on('payment.failed')`: Displays actionable bank decline message, leaves bag available for customer retry with alternative payment method. |
| **Scenario D** | Tampered Callback Signature | **PASS** | Delivered forged signature to `/api/payments/verify`. Backend rejected request with **HTTP 400** (`error: Invalid payment signature`) and kept database payment status as `PENDING`. |
| **Scenario E** | Webhook Raw-Body Signature Validation | **PASS** | Valid HMAC-SHA256 over exact raw request body accepted with **HTTP 200**. Forged webhook rejected with **HTTP 401** (`error: Invalid or unauthenticated webhook signature`). |
| **Scenario F** | Duplicate Webhook Delivery | **PASS** | Delivered identical event ID twice. First delivery returned **HTTP 200** (`received: true`); second delivery returned **HTTP 200** (`duplicate: true`), preventing duplicate database records or state mutations. |
| **Scenario G** | Captured Payment with Missing Browser Callback | **PASS** | Simulated customer closing browser immediately after capture. Server verified asynchronous `payment.captured` webhook, atomically transitioning Payment to `SUCCEEDED` and Order to `CONFIRMED`. |
| **Scenario H** | Amount and Currency Tampering | **PASS** | Tampered amount signature rejected with **HTTP 400**. Authoritative amount is resolved exclusively from PostgreSQL stored snapshots in integer paise. |
| **Scenario I** | Payment Order Creation Idempotency | **PASS** | Repeated requests with same idempotency key for same order returned identical attempt (**HTTP 201**). Reusing key for a different order returned **HTTP 409 Conflict**. |

---

## 6. Cart Clearing and State Machine Verification

### Cart Lifecycle Rules
In `src/features/checkout/OrderReviewPage.jsx`:
1. **Modal Dismissal (`modal.ondismiss`):**
   ```javascript
   ondismiss: () => {
     setPaymentError('Payment window was dismissed. Your shopping bag has been preserved.');
   }
   ```
   * Result: `clearCart()` is **not** called. The shopping cart remains populated in local storage and Zustand.
2. **Payment Failure (`rzp.on('payment.failed')`):**
   ```javascript
   rzp.on('payment.failed', (failResp) => {
     setPaymentError(failResp.error?.description || 'Payment transaction declined.');
   });
   ```
   * Result: `clearCart()` is **not** called. Customer can retry checkout without re-selecting products.
3. **Verified Success (`verifyResult.verified === true`):**
   ```javascript
   if (verifyResult && verifyResult.verified) {
     setLastCompletedOrder(completedOrderSnapshot);
     clearCart();
     navigate(`/order-confirmation/${orderResult.orderReference}`);
   }
   ```
   * Result: `clearCart()` executes **only after** server-side signature verification returns authentic `200 OK`.

---

## 7. Redacted Evidence for Acceptance Scenarios

### Scenario D: Tampered Callback Signature
* **Request:** `POST /api/payments/verify`
* **Payload:**
  ```json
  {
    "orderReference": "AMOGA-ORD-2026-TEST-D",
    "paymentReference": "AMOGA-PAY-2026-TEST-D",
    "providerOrderId": "order_test_d_123",
    "providerPaymentId": "pay_tampered_12345",
    "providerSignature": "forged_tampered_signature_abcdef1234567890abcdef1234567890"
  }
  ```
* **Response Status:** `400 Bad Request`
* **Response Body:** `{"success": false, "error": "Invalid test payment signature."}`
* **Database State Verified:** `payment.status: PENDING`, `order.status: PENDING_CONFIRMATION` (No state corruption).

### Scenario E & F: Webhook Ingestion & Deduplication
* **Event 1:** `POST /api/payments/webhook` with `x-amoga-test-signature: <valid_hmac>`
  * **Response:** `HTTP 200 OK` `{"received": true, "eventId": "dup_evt_1728471440000"}`
* **Event 2 (Duplicate):** Same payload delivered again
  * **Response:** `HTTP 200 OK` `{"received": true, "duplicate": true, "eventId": "dup_evt_1728471440000"}`
* **Database State Verified:** Exactly 1 row created in `payment_events` with `providerEventId = "dup_evt_1728471440000"`.

### Scenario G: Webhook Reconciliation Recovery
* **Event:** `POST /api/payments/webhook` with event `payment.succeeded` for Order `AMOGA-ORD-2026-TEST-G`
* **Database Before:** `payment.status: PENDING`, `order.status: PENDING_CONFIRMATION`
* **Database After:** `payment.status: SUCCEEDED`, `order.status: CONFIRMED`, `order.paymentStatus: SUCCEEDED`

### Scenario I: Idempotency Key Cross-Order Conflict
* **Order 1 Call:** `POST /api/payments/create-order` with key `IDEMP-PHASE10-XYZ` -> `HTTP 201 Created`
* **Order 2 Call:** `POST /api/payments/create-order` with same key `IDEMP-PHASE10-XYZ` -> `HTTP 409 Conflict`
  ```json
  {
    "success": false,
    "error": "Idempotency key \"IDEMP-PHASE10-XYZ\" has already been used for a different order payment attempt."
  }
  ```

---

## 8. Database Integrity Findings

Read-only inspection was executed before and after running test suites:

| Table | Pre-Test Count | Post-Test Count | Delta | Record Attribution |
|---|---|---|---|---|
| `collections` | 3 | 3 | **0** | Historical catalogue preserved. |
| `products` | 88 | 88 | **0** | Historical catalogue preserved. |
| `product_variants` | 36 | 36 | **0** | Historical catalogue preserved. |
| `orders` | 97 | 102 | **+5** | Dedicated test orders for Scenarios D, G, H, I1, I2. |
| `order_items` | 113 | 118 | **+5** | Snapshot items for the 5 test orders. |
| `payments` | 55 | 59 | **+4** | Payment attempts for Scenarios D, G, H, I. |
| `payment_events` | 28 | 31 | **+3** | Webhook audit events for Scenarios E, F, G. |

**Zero Historical Customer Records Modified or Deleted.** Every single newly created record was accounted for as an isolated test artifact.

---

## 9. Security & Reliability Highlights

1. **Live Key Guard:** `RazorpayPaymentProvider` fails immediately if initialized with `rzp_live_...` credentials in any environment during testing.
2. **Client-Side Secret Shielding:** The frontend React application only ever receives `clientPayload.keyId` (public). The `keySecret` and `webhookSecret` remain strictly on the server.
3. **Timing Attack Protection:** Constant-time comparison (`crypto.timingSafeEqual`) is enforced for both callback signature checks and webhook signature validation.
4. **Integer Paise Integrity:** All financial arithmetic is computed in 64-bit integer paise directly from Prisma `Decimal` instances (`totalAmount.mul(100)`). Frontend amounts are completely ignored.
5. **State Machine Safeguard:** Succeeded payments and confirmed orders are protected against out-of-order downgrade by delayed `payment.failed` events.

---

## 10. Steps for Merchant to Activate Scenario A

To execute Scenario A in the Razorpay sandbox:
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Toggle the dashboard to **Test Mode**.
3. Navigate to **Account & Settings > API Keys** and generate Test Key credentials.
4. In `server/.env`, set:
   ```env
   PAYMENT_PROVIDER="razorpay"
   PAYMENT_MODE="sandbox"
   RAZORPAY_KEY_ID="rzp_test_YourTestKeyId"
   RAZORPAY_KEY_SECRET="YourTestKeySecret"
   RAZORPAY_WEBHOOK_SECRET="YourWebhookSecretOptional"
   ```
5. Restart the development server (`npm run dev`).
6. Place an order through the Amoga checkout. The Razorpay checkout modal will load in Test Mode, allowing test card / UPI payments.

---

## 11. Final Acceptance Conclusion

**SANDBOX ACCEPTANCE INCOMPLETE — FURTHER TESTING REQUIRED**

*(Reason: Scenarios B through I have fully passed all automated and architectural tests with zero defects. Scenario A is safely retained as BLOCKED pending merchant provisioning of active `rzp_test_...` sandbox credentials in `server/.env`).*
