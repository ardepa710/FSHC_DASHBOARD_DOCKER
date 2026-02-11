#!/bin/bash

echo "=== FSHC Dashboard - Database Setup ==="
echo ""

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL client not found. Please install PostgreSQL."
    exit 1
fi

# Create database if not exists
echo "Creating database 'fshc_dashboard'..."
sudo -u postgres psql -c "CREATE DATABASE fshc_dashboard;" 2>/dev/null || echo "Database may already exist"

# Run Prisma migrations
echo ""
echo "Running Prisma migrations..."
cd backend
npx prisma db push

# Seed the database
echo ""
echo "Seeding database with initial data..."
npm run db:seed

echo ""
echo "=== Database setup complete! ==="
echo ""
echo "You can now start the application with:"
echo "  npm run dev"
