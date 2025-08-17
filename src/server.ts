import { Server } from 'http';
import app from './app';
import config from './app/config';
import { scheduledAutoCancelPendingJobs } from './app/modules/appointment/jobs/autoCancelPendingAppointments';

process.on('uncaughtException', (err) => {
  console.error(err);
  process.exit(1);
});

let server: Server | null = null;

async function startServer() {
  server = app.listen(config.port, () => {
    console.log(`🎯 Server listening on port: ${config.port}`);
  });

  // Set server timeout to 30 seconds (30000ms)
  if (server) {
    server.timeout = 30000;
    server.keepAliveTimeout = 61000; // Should be higher than timeout
    server.headersTimeout = 62000; // Should be higher than keepAliveTimeout
  }

  process.on('unhandledRejection', (error) => {
    if (server) {
      server.close(() => {
        console.log(error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

scheduledAutoCancelPendingJobs();

startServer();

process.on('SIGTERM', () => {
  if (server) {
    server.close();
  }
});
