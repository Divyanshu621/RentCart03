#!/bin/sh
# Render startup script for PostgreSQL

echo "📁 DATABASE_URL: $DATABASE_URL"

# Push schema to database (creates tables)
echo "🔄 Pushing database schema..."
npx prisma db push --accept-data-loss 2>&1

# Seed database using Node.js seed script
echo "🌱 Seeding database..."
node prisma/seed-render.js 2>&1 || true

# Start the Next.js server
echo "🚀 Starting RentCart server..."
exec node .next/standalone/server.js
