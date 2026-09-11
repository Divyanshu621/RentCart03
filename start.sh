#!/bin/sh
set -e

echo "🚀 Starting RentCart..."

# Make sure DATABASE_URL exists
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Push Prisma schema to Render PostgreSQL
echo "🔄 Pushing database schema..."
npx prisma db push --accept-data-loss

# Check whether database has users
echo "🌱 Checking database..."

SEED_COUNT=$(node - <<'NODE'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

prisma.user.count()
  .then(count => {
    console.log(count);
  })
  .catch(() => {
    console.log("0");
  })
  .finally(() => prisma.$disconnect());
NODE
)

if [ "$SEED_COUNT" = "0" ]; then
  echo "🌱 Database is empty, running seed..."

  node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  const categories = [
    'Electronics',
    'Laptops',
    'Cameras',
    'Gaming',
    'Sports',
    'Furniture',
    'Tools',
    'Vehicles',
    'Home Appliances',
    'Bikes'
  ];

  for (const name of categories) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug
      }
    });
  }

  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: {
      email: 'admin@rentcart.com'
    },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@rentcart.com',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
      trustScore: 100
    }
  });

  const customerPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: {
      email: 'customer@rentcart.com'
    },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'customer@rentcart.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      isVerified: true,
      isActive: true,
      trustScore: 50
    }
  });

  console.log('✅ Seed complete');

  await prisma.$disconnect();
}

seed().catch(async error => {
  console.error('❌ Seed error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
NODE

else
  echo "✅ Database already has $SEED_COUNT users"
  echo "⏭️ Skipping seed"
fi

# Render requires the server to listen on its PORT
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT="${PORT:-10000}"

echo "🚀 Starting Next.js on port $PORT..."

exec node .next/standalone/server.js