#!/bin/sh
# Render startup script
# Handles SQLite database path resolution for Render's filesystem

# If DATABASE_URL points to an absolute non-writable path, override it
# Render's writable directory is the project root (where this script runs)
if echo "$DATABASE_URL" | grep -q "^file:/"; then
  # Absolute path - check if parent dir is writable
  DB_PATH=$(echo "$DATABASE_URL" | sed 's|^file:||')
  DB_DIR=$(dirname "$DB_PATH")
  if [ ! -w "$DB_DIR" ] 2>/dev/null; then
    echo "⚠ DATABASE_URL points to non-writable path: $DATABASE_URL"
    echo "→ Overriding to relative path: file:./db/production.db"
    export DATABASE_URL="file:./db/production.db"
  fi
fi

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:./db/production.db"
fi

echo "📁 DATABASE_URL: $DATABASE_URL"

# Create db directory if needed
mkdir -p ./db

# Push schema to database (creates tables if they don't exist)
echo "🔄 Pushing database schema..."
npx prisma db push --accept-data-loss 2>&1

# Seed database if empty (no users table data)
echo "🌱 Checking if database needs seeding..."
SEED_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c); p.\$disconnect(); }).catch(() => { console.log(0); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$SEED_COUNT" = "0" ]; then
  echo "🌱 Database is empty, running seed..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const p = new PrismaClient();
    async function seed() {
      // Create basic categories
      const cats = ['Electronics', 'Laptops', 'Cameras', 'Gaming', 'Sports', 'Furniture', 'Tools', 'Vehicles', 'Home Appliances', 'Bikes'];
      for (const name of cats) {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        await p.category.upsert({ where: { slug }, update: {}, create: { name, slug } });
      }
      // Create admin user
      const hash = await bcrypt.hash('admin123', 10);
      await p.user.upsert({ where: { email: 'admin@rentcart.com' }, update: {}, create: { name: 'Admin', email: 'admin@rentcart.com', passwordHash: hash, role: 'SUPER_ADMIN', isVerified: true, isActive: true, trustScore: 100 }});
      // Create demo customer
      const hash2 = await bcrypt.hash('password123', 10);
      await p.user.upsert({ where: { email: 'customer@rentcart.com' }, update: {}, create: { name: 'Demo Customer', email: 'customer@rentcart.com', passwordHash: hash2, role: 'CUSTOMER', isVerified: true, isActive: true, trustScore: 50 }});
      console.log('✅ Seed complete');
      await p.\$disconnect();
    }
    seed().catch(e => { console.error('Seed error:', e.message); process.exit(0); });
  " 2>&1 || true
else
  echo "✅ Database already has $SEED_COUNT users, skipping seed"
fi

# Start the Next.js server
echo "🚀 Starting RentCart server..."
exec node .next/standalone/server.js
