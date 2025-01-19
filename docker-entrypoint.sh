#!/bin/bash
set -e

echo "Running migrations"
pnpm run db:deploy
echo "Migrations done"

echo "Running seed"
pnpm run db:seed
echo "Seed done"

exec "$@"
