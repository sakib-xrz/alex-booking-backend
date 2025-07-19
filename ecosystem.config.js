module.exports = {
  apps: [
    {
      name: 'alex-booking-backend',
      script: './dist/server.js',
      cwd: '/root/app/alex-booking-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
