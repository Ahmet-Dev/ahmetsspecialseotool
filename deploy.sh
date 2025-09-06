#!/bin/bash

# Ahmet's Special SEO Tool - Production Deployment Script
# Copyright © 2025 Ahmet Kahraman

set -e

echo "🚀 Ahmet's Special SEO Tool - Production Deployment"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE="axxmet/ahmets-special-seo-tool:latest"
CONTAINER_NAME="ahmets-seo-tool-production"
PORT="1389"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    log_info "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Docker and Docker Compose are available"
}

# Check server requirements
check_requirements() {
    log_info "Checking server requirements..."
    
    # Check port availability
    if netstat -tuln | grep ":$PORT " &> /dev/null; then
        log_warning "Port $PORT is already in use"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check available memory
    AVAILABLE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$AVAILABLE_MEM" -lt 512 ]; then
        log_warning "Low available memory: ${AVAILABLE_MEM}MB (recommended: 512MB+)"
    fi
    
    # Check disk space
    AVAILABLE_DISK=$(df -BM . | awk 'NR==2{print $4}' | tr -d 'M')
    if [ "$AVAILABLE_DISK" -lt 1024 ]; then
        log_warning "Low disk space: ${AVAILABLE_DISK}MB (recommended: 1GB+)"
    fi
    
    log_success "Server requirements check completed"
}

# Stop existing container
stop_existing() {
    log_info "Stopping existing containers..."
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Stopping existing container: $CONTAINER_NAME"
        docker stop "$CONTAINER_NAME" || true
        docker rm "$CONTAINER_NAME" || true
        log_success "Existing container removed"
    else
        log_info "No existing container found"
    fi
}

# Pull latest image
pull_image() {
    log_info "Pulling latest Docker image..."
    docker pull "$DOCKER_IMAGE"
    log_success "Latest image pulled successfully"
}

# Deploy container
deploy() {
    log_info "Deploying SEO Tool container..."
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        -p "$PORT:80" \
        -e NODE_ENV=production \
        -e TZ=Europe/Istanbul \
        --security-opt no-new-privileges:true \
        --cap-drop ALL \
        --cap-add CHOWN \
        --cap-add SETGID \
        --cap-add SETUID \
        --read-only \
        --tmpfs /var/cache/nginx:noexec,nosuid,size=10m \
        --tmpfs /var/run:noexec,nosuid,size=10m \
        --tmpfs /tmp:noexec,nosuid,size=10m \
        --log-opt max-size=10m \
        --log-opt max-file=3 \
        "$DOCKER_IMAGE"
    
    log_success "Container deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    sleep 10
    
    local max_attempts=12
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "$CONTAINER_NAME" curl -f http://localhost/ &> /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 5
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Show status
show_status() {
    log_info "Container status:"
    docker ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    log_info "Application URLs:"
    echo "  🌐 Local: http://localhost:$PORT"
    echo "  🌐 Server: http://$(curl -s ifconfig.me):$PORT"
    
    log_info "Logs:"
    echo "  📝 View logs: docker logs $CONTAINER_NAME"
    echo "  📝 Follow logs: docker logs -f $CONTAINER_NAME"
    
    log_info "Management:"
    echo "  🔄 Restart: docker restart $CONTAINER_NAME"
    echo "  🛑 Stop: docker stop $CONTAINER_NAME"
    echo "  🗑️ Remove: docker rm -f $CONTAINER_NAME"
}

# Cleanup on error
cleanup() {
    log_error "Deployment failed. Cleaning up..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    exit 1
}

# Main deployment process
main() {
    trap cleanup ERR
    
    echo "Starting deployment process..."
    echo "Container: $CONTAINER_NAME"
    echo "Image: $DOCKER_IMAGE"
    echo "Port: $PORT"
    echo ""
    
    check_docker
    check_requirements
    stop_existing
    pull_image
    deploy
    
    if health_check; then
        show_status
        log_success "🎉 Deployment completed successfully!"
        echo ""
        echo "🔒 Security Notice:"
        echo "This application is protected by copyright."
        echo "Commercial use requires permission from Ahmet Kahraman."
        echo "Contact: iletisimahmetkahraman@gmail.com"
    else
        log_error "Deployment failed during health check"
        docker logs "$CONTAINER_NAME" | tail -20
        exit 1
    fi
}

# Run main function
main "$@"
