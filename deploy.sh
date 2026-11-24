#!/bin/bash
# ==========================================
# UNITECH CCTV - Automated Lightsail Deployment
# ==========================================

set -e

echo "🚀 [1/4] Pulling latest changes from Git..."
git pull origin main

echo "📦 [2/4] Building and launching Docker container..."
docker compose up -d --build

echo "🧹 [3/4] Cleaning dangling images..."
docker image prune -f

echo "✅ [4/4] Deployment complete! Application is running on port 3000."
docker compose ps

