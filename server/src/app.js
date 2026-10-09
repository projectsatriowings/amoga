import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../dist');

export const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: false,
  })
);
app.disable('x-powered-by');

// Restricted CORS
const allowedOrigins = [
  env.FRONTEND_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or Render URLs
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-access-token', 'Idempotency-Key'],
  })
);

// Body Parsers with size limits & rawBody preservation for webhooks
app.use(
  express.json({
    limit: '100kb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Standard Rate Limiter for all routes
app.use(standardRateLimiter);

// Mount API Routes
app.use('/api', apiRoutes);

// Serve static frontend assets if dist directory exists (Render / production deployment)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Not Found & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);
