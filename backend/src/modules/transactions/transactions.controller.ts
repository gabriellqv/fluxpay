import { Request, Response } from 'express';
import { AppError } from '../../errors/AppError';
import { createTransactionSchema, getTransactionHistoryQuerySchema } from './transactions.dtos';
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

  getHistory = async (req: Request, res: Response) => {
    const userId = req.userId!;
    const query = getTransactionHistoryQuerySchema.parse(req.query);

    const history = await this.transactionsService.getHistory(userId, query);
    res.status(200).json(history);
  };

  findById = async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params as { id: string };

    const transaction = await this.transactionsService.findById(id, userId);
    res.status(200).json(transaction);
  };
}
