#!/bin/bash

# Production startup script
echo "🚀 Starting Electricity Prices in Production Mode..."

# Copy production environment
cp .env.production .env

# Build and start services
docker-compose --env-file .env.production up -d --build

echo "✅ Production environment started!"
echo ""
echo "📱 Services:"
echo "  Frontend: http://localhost:80 (Nginx served)"
echo "  Backend:  http://localhost:3000 (Express)"
echo "  Database: localhost:5432"
echo ""
echo "🔧 Production features:"
echo "  - Optimized builds"
echo "  - Nginx serving static files"
echo "  - Production dependencies only"
echo ""
echo "📊 View logs:"
echo "  docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose down" 