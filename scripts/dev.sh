#!/bin/bash

# Development startup script
echo "🚀 Starting Electricity Prices in Development Mode..."

# Copy development environment
cp .env.development .env

# Build and start services with development override
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.development up -d --build

echo "✅ Development environment started!"
echo ""
echo "📱 Services:"
echo "  Frontend: http://localhost:5173 (Vite dev server)"
echo "  Backend:  http://localhost:3000 (Express with nodemon)"
echo "  Database: localhost:5432"
echo ""
echo "🔧 Hot-reload enabled for:"
echo "  - Frontend (Vue.js + Vite)"
echo "  - Backend (Express + nodemon)"
echo "  - Data Sync (nodemon)"
echo ""
echo "📊 View logs:"
echo "  docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose -f docker-compose.yml -f docker-compose.dev.yml down" 