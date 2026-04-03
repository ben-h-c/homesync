#!/usr/bin/env bash
set -e

echo "=== HomeSync Setup ==="
echo ""

# Copy .env if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Run migrations
echo "Running database migrations..."
cd database && npx knex migrate:latest --knexfile knexfile.js && cd ..

# Run seeds
echo "Seeding database..."
cd database && npx knex seed:run --knexfile knexfile.js && cd ..

echo ""
echo "=== Setup complete! ==="
echo "  Start the server:  npm run dev:server"
echo "  Start the client:  npm run dev:client"
echo "  Or both:           npm run dev"
