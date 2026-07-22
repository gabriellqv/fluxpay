import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { createTransactionSchema } from './transactions.dtos';
import { TransactionsService } from './transactions.service';

export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  create = async (req: Request, res: Response) => {
    const senderId = req.userId;

    if (!senderId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const body = createTransactionSchema.parse(req.body);

    const transaction = await this.transactionsService.create({
      senderId,
      receiverId: body.receiverId,
      amount: body.amount,
    });

    res.status(201).json(transaction);
  };
}
