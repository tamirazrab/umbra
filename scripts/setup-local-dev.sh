#!/bin/bash

# Local Development Setup Script
# This script helps set up the local development environment

set -e

echo "🚀 Umbra Local Development Setup"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker Compose is available"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ .env file created"
        echo "⚠️  Please review and update .env file with your configuration"
    else
        echo "❌ env.example file not found"
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Ask user if they want to start services
read -p "Do you want to start all services now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🐳 Starting Docker services..."
    
    # Use docker compose if available, otherwise docker-compose
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.dev.yml up -d
    else
        docker-compose -f docker-compose.dev.yml up -d
    fi
    
    echo ""
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
    
    echo ""
    echo "📊 Service Status:"
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.dev.yml ps
    else
        docker-compose -f docker-compose.dev.yml ps
    fi
    
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📚 Access your services:"
    echo "   - PostgreSQL:    localhost:5432"
    echo "   - PgAdmin:       http://localhost:5050"
    echo "   - MongoDB:        localhost:27017"
    echo "   - Mongo Express:  http://localhost:8081"
    echo "   - Redis:          localhost:6379"
    echo "   - Zipkin:         http://localhost:9411"
    echo "   - Prometheus:     http://localhost:9090"
    echo "   - Grafana:        http://localhost:3001"
    echo "   - Alertmanager:   http://localhost:9093"
    echo ""
    echo "📖 For more information, see LOCAL_DEVELOPMENT_SETUP.md"
else
    echo ""
    echo "ℹ️  To start services later, run:"
    echo "   docker-compose -f docker-compose.dev.yml up -d"
    echo ""
    echo "📖 For more information, see LOCAL_DEVELOPMENT_SETUP.md"
fi

