import { Router } from 'express';
import { usersController } from '../../registry';

export const usersRoutes = Router();

usersRoutes.post('/', usersController.create);
usersRoutes.patch('/:id', usersController.update);
usersRoutes.put('/:id', usersController.replace);
usersRoutes.delete('/:id', usersController.delete);
