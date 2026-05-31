#!/bin/sh
set -e

echo "⏳ Running database migrations..."
npx prisma migrate deploy

echo "🌱 Running database seed (if first run)..."
node dist/prisma/seed.js 2>/dev/null || true

echo "🚀 Starting server..."
exec node dist/src/server.js
