import rateLimit from 'express-rate-limit';

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

export const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Operações sensíveis repetitivas detectadas. Por favor, tente novamente mais tarde.',
  },
});
