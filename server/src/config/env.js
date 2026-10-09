import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

// 1. Mandatory Environment Checks
const requiredEnvVars = ['DATABASE_URL'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`[FATAL CONFIG ERROR]: Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// 2. Secret Key Hardening
let guestSecret = process.env.GUEST_ORDER_TOKEN_SECRET;

if (nodeEnv === 'production') {
  if (!guestSecret || guestSecret.length < 32 || guestSecret.includes('default') || guestSecret.includes('change-in-production')) {
    console.error('[FATAL SECURITY ERROR]: GUEST_ORDER_TOKEN_SECRET must be a strong, cryptographically secure secret (minimum 32 characters) in production.');
    process.exit(1);
  }
} else {
  if (!guestSecret || guestSecret.includes('default')) {
    console.warn('[SECURITY NOTICE]: Using auto-generated ephemeral cryptographic secret for development session.');
    guestSecret = crypto.randomBytes(32).toString('hex');
  }
}

// 3. Payment Provider Configuration & Security
const paymentProvider = (process.env.PAYMENT_PROVIDER || 'test').toLowerCase();
const validProviders = ['test', 'razorpay', 'cashfree', 'stripe'];

if (!validProviders.includes(paymentProvider)) {
  console.error(`[FATAL CONFIG ERROR]: Invalid PAYMENT_PROVIDER: "${paymentProvider}". Supported: ${validProviders.join(', ')}`);
  process.exit(1);
}

if (nodeEnv === 'production' && paymentProvider === 'test') {
  console.error('[FATAL SECURITY ERROR]: Development test payment provider ("test") cannot be activated in production.');
  process.exit(1);
}

let testPaymentSecret = process.env.TEST_PAYMENT_SECRET;
if (!testPaymentSecret) {
  testPaymentSecret = crypto.randomBytes(32).toString('hex');
}

// 4. Razorpay Specific Configuration
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (paymentProvider === 'razorpay') {
  if (!razorpayKeyId || !razorpayKeySecret) {
    if (nodeEnv === 'production') {
      console.error('[FATAL CONFIG ERROR]: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are mandatory when PAYMENT_PROVIDER is "razorpay".');
      process.exit(1);
    } else {
      console.warn('[CONFIG NOTICE]: PAYMENT_PROVIDER is razorpay, but RAZORPAY_KEY_ID/SECRET are not set. Ensure sandbox keys are defined in server/.env for live sandbox calls.');
    }
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: parseInt(process.env.PORT || '5001', 10),
  NODE_ENV: nodeEnv,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  GUEST_ORDER_TOKEN_SECRET: guestSecret,
  PAYMENT_PROVIDER: paymentProvider,
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'test',
  PAYMENT_CURRENCY: process.env.PAYMENT_CURRENCY || 'INR',
  TEST_PAYMENT_SECRET: testPaymentSecret,
  RAZORPAY_KEY_ID: razorpayKeyId,
  RAZORPAY_KEY_SECRET: razorpayKeySecret,
  RAZORPAY_WEBHOOK_SECRET: razorpayWebhookSecret,
};
