import { Request, Response } from 'express';
import { createTransactionSchema } from './transactions.dtos';
import { TransactionsService } from './transactions.service';

export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  create = async (req: Request, res: Response) => {
    const data = createTransactionSchema.parse(req.body);
    const transaction = await this.transactionsService.create(data);
    res.status(201).json(transaction);
  };
}
