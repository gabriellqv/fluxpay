import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { httpLogger } from './config/logger';
import { redisConnection } from './config/redis';
import { generateOpenApiDocument } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { v1Router } from './routes/v1.router';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(httpLogger);
app.use(globalRateLimiter);

const swaggerDocument = generateOpenApiDocument();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/v1', v1Router);

app.get(['/', '/health'], (_req, res) => {
  const redisStatus =
    redisConnection && redisConnection.status === 'ready' ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    message: 'Flux Pay API is running',
    services: {
      redis: redisStatus,
    },
  });
});

app.use(errorHandler);

export { app };
