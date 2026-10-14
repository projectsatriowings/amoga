import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';
const isLocalhost = (ip) => !ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 300,
  skip: (req) => isDev || isLocalhost(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

export const cartValidationRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDev ? 10000 : 500, // Generous limit for cart checks & browsing
  skip: (req) => isDev || isLocalhost(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many cart validation requests submitted from this IP. Please wait a few moments.',
  },
});

export const checkoutRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDev ? 5000 : 100, // Order creation & payment rate limiter
  skip: (req) => isDev || isLocalhost(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many checkout requests submitted from this IP. Please wait a few moments.',
  },
});

export const contactRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDev ? 1000 : 15, // Limit contact inquiries
  skip: (req) => isDev || isLocalhost(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many contact submissions from this IP. Please wait a few moments before trying again.',
  },
});

