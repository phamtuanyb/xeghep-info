#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/xeghep}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"
REPO_URL="${REPO_URL:-}"

if [ ! -d "$APP_DIR/.git" ]; then
  if [ -z "$REPO_URL" ]; then
    echo "REPO_URL is required for first deploy because $APP_DIR is not a git clone."
    exit 1
  fi

  mkdir -p "$APP_DIR"
  git clone --branch "$DEPLOY_BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git reset --hard "origin/$DEPLOY_BRANCH"

npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

pm2 startOrReload deploy/ecosystem.config.cjs --env production
pm2 save
