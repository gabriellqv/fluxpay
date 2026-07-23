import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma';

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const silvio = await prisma.user.upsert({
    where: { email: 'senorabravanel@email.com' },
    update: {},
    create: {
      name: 'Silvio Santos',
      email: 'senorabravanel@email.com',
      cpf: '11122233344',
      password: passwordHash,
      balance: 5000000.0,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@email.com' },
    update: {},
    create: {
      name: 'Bob Esponja',
      email: 'bob@email.com',
      cpf: '55566677788',
      password: passwordHash,
      balance: 300.0,
    },
  });

  console.log({ silvio, bob });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
