#!/bin/bash

# Electricity Prices NordPool - CapRover One-Click App Installation Script
# This script runs after the container is deployed to perform post-deployment setup

set -e

echo "🚀 Starting Electricity Prices NordPool installation..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -p 5432 -U electricity_user; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Initialize database if needed
if [ ! -f /app/database/initialized ]; then
  echo "🗄️ Initializing database schema..."
  psql $DATABASE_URL -f /app/database/init/01_schema.sql
  touch /app/database/initialized
  echo "✅ Database schema initialized!"
else
  echo "ℹ️ Database already initialized, skipping schema creation"
fi

# Start backend API
echo "🔧 Starting backend API..."
cd /app/backend
npm start &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend API to be ready..."
until curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; do
  echo "Backend API is unavailable - sleeping"
  sleep 2
done
echo "✅ Backend API is ready!"

# Start data sync worker
echo "🔄 Starting data sync worker..."
cd /app/data-sync
node src/worker.js &
WORKER_PID=$!

# Start Swagger UI
echo "📚 Starting Swagger UI..."
cd /app/swagger-ui
npx http-server -p 8080 -c-1 . &
SWAGGER_PID=$!

# Wait for Swagger UI to be ready
echo "⏳ Waiting for Swagger UI to be ready..."
until curl -f http://localhost:8080 > /dev/null 2>&1; do
  echo "Swagger UI is unavailable - sleeping"
  sleep 2
done
echo "✅ Swagger UI is ready!"

# Perform initial data sync
echo "📊 Performing initial data sync..."
cd /app/data-sync
node src/sync.js || echo "⚠️ Initial sync failed, will retry automatically"

# Start nginx
echo "🌐 Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Save PIDs for cleanup
echo $BACKEND_PID > /app/backend.pid
echo $WORKER_PID > /app/worker.pid
echo $SWAGGER_PID > /app/swagger.pid
echo $NGINX_PID > /app/nginx.pid

# Setup signal handlers for graceful shutdown
cleanup() {
  echo "🛑 Shutting down services..."
  
  if [ -f /app/backend.pid ]; then
    kill $(cat /app/backend.pid) 2>/dev/null || true
  fi
  
  if [ -f /app/worker.pid ]; then
    kill $(cat /app/worker.pid) 2>/dev/null || true
  fi
  
  if [ -f /app/swagger.pid ]; then
    kill $(cat /app/swagger.pid) 2>/dev/null || true
  fi
  
  if [ -f /app/nginx.pid ]; then
    kill $(cat /app/nginx.pid) 2>/dev/null || true
  fi
  
  echo "✅ Services shut down gracefully"
  exit 0
}

trap cleanup SIGTERM SIGINT

echo "🎉 Electricity Prices NordPool installation completed!"
echo "📱 Frontend: http://localhost"
echo "🔌 API: http://localhost/api/v1/"
echo "📚 Documentation: http://localhost/api/"
echo "💚 Health Check: http://localhost/api/v1/health"

# Keep the script running
while true; do
  sleep 1
done 