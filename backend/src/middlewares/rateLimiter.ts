import rateLimit from 'express-rate-limit';

// Applied to all routes to prevent abuse. 100 requests per 15-minute window per IP.
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas requisições originadas deste IP, por favor tente novamente mais tarde.',
  },
});

// Stricter limit for sensitive operations (auth, transactions).
// 15 requests per 15-minute window per IP to mitigate brute-force and spam.
export const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Operações sensíveis repetitivas detectadas. Por favor, tente novamente mais tarde.',
  },
});
