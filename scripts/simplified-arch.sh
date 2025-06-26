#!/bin/bash

# Simplified Architecture Migration Script
# This script helps transition from the old 6-container architecture to the new 4-container architecture

set -e

echo "🔧 Electricity Prices - Simplified Architecture Migration"
echo "========================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose down 2>/dev/null || true

# Remove old data-sync and worker containers if they exist
echo "🧹 Cleaning up old containers..."
docker rm -f electricity_data_sync electricity_worker 2>/dev/null || true

# Remove old images
echo "🗑️  Removing old images..."
docker rmi electricity-data-sync electricity-worker 2>/dev/null || true

# Build new simplified architecture
echo "🔨 Building new simplified architecture..."
docker-compose build --no-cache

# Start the new architecture
echo "🚀 Starting simplified architecture..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose ps

# Test the new sync functionality
echo "🧪 Testing new sync functionality..."
echo "Checking sync status..."
curl -s http://localhost/api/sync/status | jq . 2>/dev/null || echo "Sync status endpoint not ready yet"

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📋 What changed:"
echo "   • Removed data-sync and worker containers"
echo "   • Integrated cron jobs into backend service"
echo "   • Added startup sync checks with last run time tracking"
echo "   • Added manual sync triggers via API endpoints"
echo "   • Reduced from 6 to 4 containers"
echo ""
echo "🔗 New API endpoints:"
echo "   • GET  /api/sync/status     - Check sync worker status"
echo "   • POST /api/sync/trigger    - Trigger manual sync"
echo ""
echo "📖 For more information, see the updated README.md"
echo ""
echo "🎉 Your simplified architecture is now running!" 