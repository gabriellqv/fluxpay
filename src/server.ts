import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port: ${env.PORT}`);
});

function shutdown() {
  console.log('Shutting down gracefully...');

  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
