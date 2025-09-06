#!/bin/bash

# Server Diagnostic Script for Ahmet's Special SEO Tool
# Copyright © 2025 Ahmet Kahraman

echo "🔍 Ahmet's Special SEO Tool - Server Diagnostic"
echo "=============================================="
echo "Timestamp: $(date)"
echo "Server IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# System Information
log_section "SYSTEM INFORMATION"
echo "OS: $(uname -o) $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p 2>/dev/null || uptime)"

# Resource Usage
log_section "RESOURCE USAGE"
echo "Memory Usage:"
free -h | grep -E "(Mem|Swap)"
echo ""
echo "Disk Usage:"
df -h | grep -E "(Filesystem|/dev|tmpfs)" | head -5
echo ""
echo "CPU Usage:"
top -bn1 | head -5

# Docker Information
log_section "DOCKER STATUS"
if command -v docker &> /dev/null; then
    log_info "Docker is installed"
    echo "Docker Version: $(docker --version)"
    
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose is available"
        echo "Compose Version: $(docker-compose --version)"
    else
        log_warning "Docker Compose is not installed"
    fi
    
    # Docker service status
    if systemctl is-active docker &> /dev/null; then
        log_info "Docker service is running"
    else
        log_error "Docker service is not running"
        echo "Try: sudo systemctl start docker"
    fi
    
    # Docker disk usage
    echo ""
    echo "Docker Disk Usage:"
    docker system df 2>/dev/null || log_warning "Cannot get Docker disk usage"
    
else
    log_error "Docker is not installed"
fi

# Container Status
log_section "CONTAINER STATUS"
CONTAINER_NAME="ahmets-seo-tool-production"

if docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    log_info "Container $CONTAINER_NAME exists"
    
    CONTAINER_STATUS=$(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}")
    if [ -n "$CONTAINER_STATUS" ]; then
        log_info "Container is running: $CONTAINER_STATUS"
    else
        log_error "Container exists but is not running"
        echo "Container state:"
        docker ps -a --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
    
    # Container logs (last 10 lines)
    echo ""
    echo "Recent container logs:"
    docker logs "$CONTAINER_NAME" --tail 10 2>/dev/null || log_warning "Cannot retrieve container logs"
    
else
    log_warning "Container $CONTAINER_NAME not found"
fi

# Network Configuration
log_section "NETWORK CONFIGURATION"
PORT="1389"

# Check if port is in use
if netstat -tlnp 2>/dev/null | grep ":$PORT " &> /dev/null; then
    PROCESS=$(netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}')
    log_info "Port $PORT is in use by: $PROCESS"
else
    log_warning "Port $PORT is not in use"
fi

# Test internal connectivity
echo ""
echo "Testing internal connectivity:"
if curl -I -s --connect-timeout 5 http://localhost:$PORT &> /dev/null; then
    log_info "localhost:$PORT is accessible"
    HTTP_STATUS=$(curl -I -s http://localhost:$PORT | head -n1)
    echo "HTTP Response: $HTTP_STATUS"
else
    log_error "localhost:$PORT is not accessible"
fi

# Firewall Status
log_section "FIREWALL STATUS"
if command -v ufw &> /dev/null; then
    echo "UFW Status:"
    sudo ufw status 2>/dev/null || echo "Unable to check UFW status (permission required)"
elif command -v firewall-cmd &> /dev/null; then
    echo "FirewallD Status:"
    firewall-cmd --list-ports 2>/dev/null || echo "Unable to check firewall status"
elif command -v iptables &> /dev/null; then
    echo "iptables rules (port $PORT):"
    iptables -L | grep -i "$PORT" || echo "No specific rules found for port $PORT"
else
    log_warning "No firewall management tool detected"
fi

# Docker Image Information
log_section "DOCKER IMAGE STATUS"
IMAGE_NAME="axxmet/ahmets-special-seo-tool"

if docker images --filter "reference=$IMAGE_NAME" --format "{{.Repository}}" | grep -q "$IMAGE_NAME"; then
    log_info "Docker image $IMAGE_NAME is available locally"
    echo "Image details:"
    docker images --filter "reference=$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    # Try to pull latest
    echo ""
    echo "Checking for updates..."
    docker pull "$IMAGE_NAME:latest" &> /dev/null && log_info "Image is up to date" || log_warning "Failed to check for updates"
else
    log_warning "Docker image $IMAGE_NAME not found locally"
    echo "Try: docker pull $IMAGE_NAME:latest"
fi

# Health Check
log_section "APPLICATION HEALTH CHECK"
if docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
    echo "Testing application health..."
    
    # Test root endpoint
    if docker exec "$CONTAINER_NAME" curl -f -s http://localhost/ &> /dev/null; then
        log_info "Application health check passed"
    else
        log_error "Application health check failed"
        echo "Checking nginx status inside container:"
        docker exec "$CONTAINER_NAME" ps aux | grep nginx 2>/dev/null || log_warning "Cannot check nginx processes"
    fi
    
    # Test specific endpoint
    if docker exec "$CONTAINER_NAME" curl -f -s http://localhost/index.html &> /dev/null; then
        log_info "Static files are accessible"
    else
        log_warning "Static files may not be accessible"
    fi
else
    log_warning "Cannot perform health check - container not running"
fi

# Recommendations
log_section "RECOMMENDATIONS"
if ! docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep -q "$CONTAINER_NAME"; then
    echo "🚀 To deploy the application:"
    echo "   curl -o deploy.sh https://raw.githubusercontent.com/Ahmet-Dev/ahmetsspecialseotool/main/deploy.sh"
    echo "   chmod +x deploy.sh"
    echo "   ./deploy.sh"
    echo ""
fi

echo "📞 For support, contact: iletisimahmetkahraman@gmail.com"
echo "📁 GitHub: https://github.com/Ahmet-Dev/ahmetsspecialseotool"
echo "🐳 Docker Hub: https://hub.docker.com/r/axxmet/ahmets-special-seo-tool"

echo ""
log_section "DIAGNOSTIC COMPLETE"
echo "Save this output and share with support if needed."
