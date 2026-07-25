import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheService } from './cache.service';

vi.mock('../config/redis', () => ({
  redisConnection: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  },
}));

vi.mock('../config/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return parsed data on cache hit', async () => {
    const { redisConnection } = await import('../config/redis');
    vi.mocked(redisConnection!.get).mockResolvedValue(JSON.stringify({ balance: 100 }));

    const result = await cacheService.get<{ balance: number }>('test-key');

    expect(result).toEqual({ balance: 100 });
    expect(redisConnection!.get).toHaveBeenCalledWith('test-key');
  });

  it('should return null on cache miss', async () => {
    const { redisConnection } = await import('../config/redis');
    vi.mocked(redisConnection!.get).mockResolvedValue(null);

    const result = await cacheService.get('test-key');

    expect(result).toBeNull();
  });

  it('should set item with TTL in redis', async () => {
    const { redisConnection } = await import('../config/redis');

    await cacheService.set('test-key', { data: 'ok' }, 60);

    expect(redisConnection!.set).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify({ data: 'ok' }),
      'EX',
      60,
    );
  });

  it('should delete key', async () => {
    const { redisConnection } = await import('../config/redis');

    await cacheService.del('test-key');

    expect(redisConnection!.del).toHaveBeenCalledWith('test-key');
  });

  it('should delete keys by pattern', async () => {
    const { redisConnection } = await import('../config/redis');
    vi.mocked(redisConnection!.keys).mockResolvedValue(['key1', 'key2']);

    await cacheService.delByPattern('user:1:history:*');

    expect(redisConnection!.keys).toHaveBeenCalledWith('user:1:history:*');
    expect(redisConnection!.del).toHaveBeenCalledWith('key1', 'key2');
  });
});
