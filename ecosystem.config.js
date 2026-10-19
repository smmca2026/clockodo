module.exports = {
  apps: [
    {
      name: 'clockodo',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 2000,
      exp_backoff_restart_delay: 100,
      min_uptime: '5s',
      max_restarts: 100,
      env: {
        NODE_ENV: 'production',
        PORT: 3022
      }
    }
  ]
};
