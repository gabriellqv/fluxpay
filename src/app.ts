import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiDocument } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { globalRateLimiter, sensitiveRateLimiter } from './middlewares/rateLimiter';
import { authRoutes } from './modules/auth/auth.routes';
import { transactionsRoutes } from './modules/transactions/transactions.routes';
import { usersRoutes } from './modules/users/users.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(globalRateLimiter);

const swaggerDocument = generateOpenApiDocument();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', sensitiveRateLimiter, authRoutes);
app.use('/users', usersRoutes);
app.use('/transactions', sensitiveRateLimiter, transactionsRoutes);

app.get(['/', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Flux Pay API is running' });
});

app.use(errorHandler);

export { app };
