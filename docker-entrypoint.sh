#!/bin/sh
set -e

echo "🔄 Syncing database schema..."
node node_modules/prisma/build/index.js db push --skip-generate 2>/dev/null \
  || npx --yes prisma@7.8.0 db push \
  || echo "⚠️ db push failed, continuing anyway..."

echo "🚀 Starting application..."
exec node server.js