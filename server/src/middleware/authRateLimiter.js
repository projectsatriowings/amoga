import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiting for password reset and authentication endpoints
 * Protects against brute-force and resource exhaustion
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many password reset requests from this IP. Please wait 15 minutes before trying again.',
  },
});
