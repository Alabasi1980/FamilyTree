#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/bustanalosool/repo}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

export NODE_ENV=production
export PORT="${PORT:-9322}"
export NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/bustanalosool}"

if [[ -d .git ]]; then
  git fetch origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  echo "Skipping git sync because $APP_DIR is not a git repository."
fi

npm ci
npx prisma generate
npx prisma db push
npm run build
pm2 startOrReload deploy/pm2.bustanalosool.config.cjs --update-env
pm2 save