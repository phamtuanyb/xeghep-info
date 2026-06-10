module.exports = {
  apps: [
    {
      name: "xeghep",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: process.env.APP_DIR || "/var/www/xeghep",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
