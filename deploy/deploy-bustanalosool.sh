#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/bustanalosool/repo}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
BRANCH="${BRANCH:-main}"
PM2_CONFIG="${PM2_CONFIG:-deploy/pm2.bustanalosool.config.cjs}"
BUILD_CMD="${BUILD_CMD:-npm run build}"
PORT="${PORT:-9322}"
BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-/bustanalosool}"

printf "Deploying app from %s\n" "$APP_DIR"
cd "$APP_DIR"

if [[ -f "$ENV_FILE" ]]; then
  printf "Loading env from %s\n" "$ENV_FILE"
  set -a
  . "$ENV_FILE"
  set +a
else
  printf "Warning: env file not found: %s\n" "$ENV_FILE"
fi

export NODE_ENV=production
export PORT
export NEXT_PUBLIC_BASE_PATH="$BASE_PATH"

if [[ -d .git ]]; then
  printf "Syncing git branch %s\n" "$BRANCH"
  git fetch origin
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  printf "Skipping git sync because %s is not a git repository.\n" "$APP_DIR"
fi

if [[ -f package-lock.json ]]; then
  printf "Installing dependencies with npm ci\n"
  npm ci --loglevel=warn
else
  printf "package-lock.json not found, installing dependencies with npm install --production\n"
  npm install --production --loglevel=warn
fi

printf "Generating Prisma client\n"
npx prisma generate

printf "Applying Prisma schema\n"
npx prisma db push

printf "Building app\n"
$BUILD_CMD

printf "Starting or reloading PM2\n"
pm2 startOrReload "$PM2_CONFIG" --update-env
pm2 save

printf "Deployment complete.\n"