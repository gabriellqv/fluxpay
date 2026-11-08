import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../config/prisma';
import { UsersRepository } from '../users/users.repository';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';

/**
 * Integration tests for the money-transfer invariant against a real PostgreSQL.
 *
 * The other suites mock Prisma, so they can prove the service calls the right
 * methods but not that the database actually prevents overdrafts. These tests
 * exercise the real transaction, the row locks and the `CHECK` constraints.
 *
 * They are the evidence behind the claim "the balance never goes negative":
 * 10 transfers are fired in parallel against a balance that only supports 5,
 * and the test asserts exactly 5 succeed, 5 fail with `INSUFFICIENT_FUNDS`,
 * and the final balance is zero.
 */
describe('Transactions concurrency (integration)', () => {
  const usersRepository = new UsersRepository();
  const service = new TransactionsService(new TransactionsRepository(), usersRepository);

  const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  let senderId: string;
  let receiverId: string;

  /**
   * Removes every user created by this suite, including leftovers from a
   * previous failed run. Transactions must be deleted before users because
   * the foreign keys use `ON DELETE RESTRICT`.
   */
  async function cleanupTestUsers() {
    const users = await prisma.user.findMany({
      where: { email: { startsWith: 'concurrency-' } },
      select: { id: true },
    });
    const ids = users.map((user) => user.id);

    if (ids.length === 0) return;

    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.transaction.deleteMany({
      where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] },
    });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  beforeAll(async () => {
    await cleanupTestUsers();

    const [sender, receiver] = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Concurrency Sender',
          email: `concurrency-sender-${runId}@test.dev`,
          cpf: `sender-${runId}`,
          password: 'hashed-password',
          balance: 100,
        },
      }),
      prisma.user.create({
        data: {
          name: 'Concurrency Receiver',
          email: `concurrency-receiver-${runId}@test.dev`,
          cpf: `receiver-${runId}`,
          password: 'hashed-password',
          balance: 100,
        },
      }),
    ]);

    senderId = sender.id;
    receiverId = receiver.id;
  });

  beforeEach(async () => {
    const ids = [senderId, receiverId];

    await prisma.transaction.deleteMany({
      where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] },
    });

    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { balance: 100 },
    });
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it('allows exactly as many concurrent transfers as the balance supports', async () => {
    const amount = 20;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        service.create({ senderId, receiverId, amount }).then(
          () => 'fulfilled' as const,
          (error: { code?: string }) => error.code ?? 'unknown_error',
        ),
      ),
    );

    const succeeded = results.filter((result) => result === 'fulfilled').length;
    const rejected = results.filter((result) => result === 'INSUFFICIENT_FUNDS').length;

    expect(succeeded).toBe(5);
    expect(rejected).toBe(5);

    const [sender, receiver] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: senderId } }),
      prisma.user.findUniqueOrThrow({ where: { id: receiverId } }),
    ]);

    expect(sender.balance.toNumber()).toBe(0);
    expect(receiver.balance.toNumber()).toBe(200);

    const transactionCount = await prisma.transaction.count({
      where: { senderId, receiverId },
    });
    expect(transactionCount).toBe(5);
  });

  it('does not deadlock when two users transfer to each other concurrently', async () => {
    const amount = 10;

    const results = await Promise.allSettled([
      ...Array.from({ length: 5 }, () => service.create({ senderId, receiverId, amount })),
      ...Array.from({ length: 5 }, () =>
        service.create({ senderId: receiverId, receiverId: senderId, amount }),
      ),
    ]);

    const rejected = results.filter((result) => result.status === 'rejected');
    expect(rejected).toHaveLength(0);

    const [sender, receiver] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: senderId } }),
      prisma.user.findUniqueOrThrow({ where: { id: receiverId } }),
    ]);

    // Both directions moved the same total, so the net balance is unchanged.
    expect(sender.balance.toNumber()).toBe(100);
    expect(receiver.balance.toNumber()).toBe(100);

    const transactionCount = await prisma.transaction.count({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
    expect(transactionCount).toBe(10);
  });
});
