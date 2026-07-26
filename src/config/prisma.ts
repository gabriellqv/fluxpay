import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';

const connectionString = env.DATABASE_URL;

// Uses the pg adapter instead of the default Prisma driver so that
// the same connection pool can be shared with other pg-dependent tools.
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
