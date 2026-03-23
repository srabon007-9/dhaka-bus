#!/bin/bash

# Dhaka Bus Tracking - Quick Start Script
# This script helps you get started with the application

set -e  # Exit on error

echo "🚌 Dhaka Bus Tracking - Quick Start Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored text
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info "Starting Docker services..."

# Change to project directory
cd "$(dirname "$0")"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Please install Docker from https://www.docker.com/products/docker-desktop"
    exit 1
fi

print_success "Docker found"

# Check if Docker daemon is running
if ! docker ps > /dev/null 2>&1; then
    print_warning "Docker daemon is not running. Starting Docker..."
    if [ "$(uname)" == "Darwin" ]; then
        open -a Docker
        sleep 5
    else
        print_warning "Please start Docker and run this script again"
        exit 1
    fi
fi

print_success "Docker daemon is running"

# Build and start containers
print_info "Building Docker images... (this may take a few minutes on first run)"
echo ""

docker-compose up --build -d

# Wait for services to be healthy
print_info "Waiting for services to start..."

echo -n "Waiting for MySQL..."
for i in {1..30}; do
    if docker-compose exec -T mysql mysql -u root -p'password' -e "SELECT 1" > /dev/null 2>&1; then
        print_success "MySQL is running"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo -n "Waiting for Backend..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Backend is running"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
print_success "All services are running!"
echo ""
echo "=========================================="
echo "🎉 Ready to go!"
echo "=========================================="
echo ""
echo "Frontend:        http://localhost"
echo "Backend API:     http://localhost:3000/api"
echo "Health Check:    http://localhost:3000/api/health"
echo ""
echo "To stop services, run:"
echo "  docker-compose down"
echo ""
echo "To view logs, run:"
echo "  docker-compose logs -f"
echo ""
