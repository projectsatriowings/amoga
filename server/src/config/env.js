import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory and root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

const nodeEnv = process.env.NODE_ENV || 'development';

// 1. Mandatory Environment Checks (with graceful cloud startup fallback)
if (!process.env.DATABASE_URL) {
  console.warn('[CONFIG WARNING]: Missing required environment variable: DATABASE_URL.');
  console.warn('[CONFIG WARNING]: Database-dependent features will return 503 until DATABASE_URL is set in environment.');
}

// 2. Secret Key Hardening
let guestSecret = process.env.GUEST_ORDER_TOKEN_SECRET;

if (!guestSecret || guestSecret.length < 32 || guestSecret.includes('default') || guestSecret.includes('change-in-production')) {
  console.warn('[SECURITY NOTICE]: Using auto-generated ephemeral cryptographic secret for session.');
  guestSecret = crypto.randomBytes(32).toString('hex');
}

// 3. Payment Provider Configuration & Security
const paymentProvider = (process.env.PAYMENT_PROVIDER || 'test').toLowerCase();
const validProviders = ['test', 'razorpay', 'cashfree', 'stripe'];

if (!validProviders.includes(paymentProvider)) {
  console.error(`[FATAL CONFIG ERROR]: Invalid PAYMENT_PROVIDER: "${paymentProvider}". Supported: ${validProviders.join(', ')}`);
  process.exit(1);
}

if (nodeEnv === 'production' && paymentProvider === 'test') {
  console.warn('[SECURITY NOTICE]: In production with test payment provider. Test simulation endpoints are enabled.');
}

let testPaymentSecret = process.env.TEST_PAYMENT_SECRET;
if (!testPaymentSecret) {
  testPaymentSecret = crypto.randomBytes(32).toString('hex');
}

// 4. Razorpay Specific Configuration
const VERIFIED_SANDBOX_KEY_ID = 'rzp_test_TqVAoKqnaVprE1';
const VERIFIED_SANDBOX_KEY_SECRET = 'cVFT1RT0RZDiSQ5LNxrsErm1';
const VERIFIED_SANDBOX_WEBHOOK_SECRET = 'amoga_rzp_webhook_secret_2026';

const isPlaceholderKey = (key) => !key || key.includes('placeholder') || key.includes('your_sandbox');

const effectivePaymentMode = process.env.PAYMENT_MODE || 'test';
const isTestMode = effectivePaymentMode !== 'live';

const rawKeyId = process.env.RAZORPAY_KEY_ID;
const rawKeySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpayKeyId = (isPlaceholderKey(rawKeyId) && isTestMode)
  ? VERIFIED_SANDBOX_KEY_ID
  : rawKeyId;

const razorpayKeySecret = (isPlaceholderKey(rawKeySecret) && isTestMode)
  ? VERIFIED_SANDBOX_KEY_SECRET
  : rawKeySecret;

const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || (isTestMode ? VERIFIED_SANDBOX_WEBHOOK_SECRET : undefined);

if (paymentProvider === 'razorpay') {
  if (!razorpayKeyId || !razorpayKeySecret) {
    if (nodeEnv === 'production' && !isTestMode) {
      console.warn('[CONFIG WARNING]: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not set in production. Online payments will require keys or customers can use Cash on Delivery.');
    } else {
      console.warn('[CONFIG NOTICE]: PAYMENT_PROVIDER is razorpay, using sandbox configuration.');
    }
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: parseInt(process.env.PORT || '5016', 10),
  NODE_ENV: nodeEnv,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  GUEST_ORDER_TOKEN_SECRET: guestSecret,
  PAYMENT_PROVIDER: paymentProvider,
  PAYMENT_MODE: effectivePaymentMode,
  PAYMENT_CURRENCY: process.env.PAYMENT_CURRENCY || 'INR',
  TEST_PAYMENT_SECRET: testPaymentSecret,
  RAZORPAY_KEY_ID: razorpayKeyId,
  RAZORPAY_KEY_SECRET: razorpayKeySecret,
  RAZORPAY_WEBHOOK_SECRET: razorpayWebhookSecret,
};
