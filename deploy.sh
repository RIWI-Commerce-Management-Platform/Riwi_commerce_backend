#!/usr/bin/env bash
# HU-03: deploys the backend on the EC2. Jenkins runs it in its deploy stage
# (pull -> install -> build -> migrations -> restart). The .env lives only on
# the server, next to this script, and points at RDS (POSTGRES_SSL=true).
set -euo pipefail

cd "$(dirname "$0")"

BRANCH="${DEPLOY_BRANCH:-main}"
APP_NAME="${PM2_APP_NAME:-commerce-api}"

if [[ ! -f .env ]]; then
  echo "deploy: .env not found in $(pwd); create it on the server first." >&2
  exit 1
fi

echo "deploy: pulling ${BRANCH}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo "deploy: installing dependencies"
npm ci

echo "deploy: building"
npm run build

echo "deploy: running migrations against the database in .env"
npm run migration:run

echo "deploy: restarting ${APP_NAME} with PM2"
if pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
  pm2 reload "${APP_NAME}" --update-env
else
  pm2 start dist/main.js --name "${APP_NAME}" --node-args="--env-file=.env"
fi
pm2 save

echo "deploy: done"
