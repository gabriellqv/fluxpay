import { Router } from 'express';
import { transactionsController } from '../../registry';

const transactionsRoutes = Router();

transactionsRoutes.post('/', transactionsController.create);

export { transactionsRoutes };
