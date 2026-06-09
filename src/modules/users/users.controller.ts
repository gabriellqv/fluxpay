import { Request, Response } from 'express';
import { createUserSchema, replaceUserSchema, updateUserSchema } from './users.dtos';
import { UsersService } from './users.service';

export class UsersController {
  constructor(private usersService: UsersService) {}

  create = async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);
    const newUser = await this.usersService.create(data);
    res.status(201).json(newUser);
  };

  update = async (req: Request, res: Response) => {
    const data = updateUserSchema.parse(req.body);
    const updatedUser = await this.usersService.update(String(req.params.id), data);
    res.status(200).json(updatedUser);
  };

  replace = async (req: Request, res: Response) => {
    const data = replaceUserSchema.parse(req.body);
    const replacedUser = await this.usersService.replace(String(req.params.id), data);
    res.status(200).json(replacedUser);
  };

  delete = async (req: Request, res: Response) => {
    await this.usersService.delete(String(req.params.id));
    res.status(204).send();
  };

  findAll = async (req: Request, res: Response) => {
    const users = await this.usersService.findAll();
    res.status(200).json(users);
  };

  findById = async (req: Request, res: Response) => {
    const user = await this.usersService.findById(String(req.params.id));
    res.status(200).json(user);
  };
}
