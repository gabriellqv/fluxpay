import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Alert, Card } from '../components/ui';
import type { LoginResponse } from '../types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>('/v1/auth/login', data);
      login(response.data.token, response.data.user);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">
          Flux Pay
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" isLoading={isLoading} className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
}
