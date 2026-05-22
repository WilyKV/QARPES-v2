#!/bin/sh
set -e

echo "🔄 Waiting for PostgreSQL..."

# Extraire host et port du DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\2|p')

# Attendre que PostgreSQL soit prêt
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  echo "⏳ Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
  sleep 1
done
echo "✅ PostgreSQL is ready!"

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️ Running database migrations..."
npx prisma migrate deploy || echo "⚠️ Migration failed (may already be applied)"

if [ "$FORCE_FIXTURES" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed || echo "⚠️ Seeding failed (database may already be seeded)"
fi

echo "🚀 Starting development server..."
exec npm run dev
