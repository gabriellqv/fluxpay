import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../app';

describe('App E2E', () => {
  it('GET /health should return 200 OK', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('message', 'Flux Pay API is running');
    expect(response.body).toHaveProperty('services');
  });

  it('GET /v1/users/me should return 401 Unauthorized without token', async () => {
    const response = await request(app).get('/v1/users/me');

    expect(response.status).toBe(401);
  });

  it('GET /v1/notifications should return 401 Unauthorized without token', async () => {
    const response = await request(app).get('/v1/notifications');

    expect(response.status).toBe(401);
  });

  it('POST /v1/transactions should return 401 Unauthorized without token', async () => {
    const response = await request(app).post('/v1/transactions').send({
      senderId: 'id-1',
      receiverId: 'id-2',
      amount: 50,
    });

    expect(response.status).toBe(401);
  });
});
