import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { httpLogger } from './config/logger';
import { generateOpenApiDocument } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { v1Router } from './routes/v1.router';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);
app.use(globalRateLimiter);

const swaggerDocument = generateOpenApiDocument();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/v1', v1Router);

app.get(['/', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Flux Pay API is running' });
});

app.use(errorHandler);

export { app };
