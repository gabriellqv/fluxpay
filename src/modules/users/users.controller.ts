import { Request, Response } from 'express';
import { createUserSchema } from './users.dtos';
import { UsersService } from './users.service';

export class UsersController {
  constructor(private usersService: UsersService) {}

  create = async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);

    const newUser = await this.usersService.create(data);

    res.status(201).json(newUser);
  };

  update = async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);

    const newUser = await this.usersService.create(data);

    res.status(201).json(newUser);
  };

  replace = async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);

    const newUser = await this.usersService.create(data);

    res.status(201).json(newUser);
  };

  delete = async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);

    const newUser = await this.usersService.create(data);

    res.status(201).json(newUser);
  };
}
