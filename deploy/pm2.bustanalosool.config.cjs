module.exports = {
  apps: [
    {
      name: "bustan-alosool",
      cwd: "/var/www/bustanalosool/repo",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 9322",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: "9322",
        NEXT_PUBLIC_BASE_PATH: "/bustanalosool",
      },
    },
  ],
};