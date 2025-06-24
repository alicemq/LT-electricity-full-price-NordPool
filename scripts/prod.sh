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
echo "  Frontend: http://localhost:80 (Nginx served with API proxy)"
echo "  Backend:  Internal only (accessed via frontend proxy)"
echo "  Database: Internal only"
echo ""
echo "🔧 Production features:"
echo "  - Optimized builds"
echo "  - Nginx serving static files"
echo "  - Frontend acts as proxy to backend"
echo "  - Backend not exposed to internet"
echo "  - Production dependencies only"
echo ""
echo "📊 View logs:"
echo "  docker-compose logs -f"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose down" 