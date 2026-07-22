import { Request, Response } from 'express';
import { loginSchema } from './auth.dtos';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    const result = await this.authService.login(data);
    res.status(200).json(result);
  };
}
