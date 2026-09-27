import { buildApp } from './app.js';
import { ENV } from './config/env.js';

const server = buildApp();

async function start() {
  try {
    await server.listen({
      port: ENV.PORT,
      host: '0.0.0.0',
    });
    console.log(`🚀 KFab360 Fastify Backend listening on http://localhost:${ENV.PORT}`);
    console.log(`🛡️  Environment: ${ENV.NODE_ENV}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful Shutdown
const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    await server.close();
    process.exit(0);
  });
});

start();
