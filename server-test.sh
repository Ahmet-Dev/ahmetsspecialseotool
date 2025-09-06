#!/bin/bash

# Ahmet's Special SEO Tool - Server Testing Script
# Quick server deployment test

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CONTAINER_NAME="ahmets-seo-tool-production"
PORT="1389"
DOMAIN="seotool.ahmetkahraman.tech"

echo "🧪 Ahmet's Special SEO Tool - Server Test"
echo "========================================"

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Test container status
test_container() {
    log_info "Testing container status..."
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no-health-check")
        log_success "✅ Container running (Health: $STATUS)"
        
        # Show container info
        UPTIME=$(docker inspect --format='{{.State.StartedAt}}' "$CONTAINER_NAME" | cut -d'T' -f1)
        IMAGE=$(docker inspect --format='{{.Config.Image}}' "$CONTAINER_NAME")
        log_info "   Image: $IMAGE"
        log_info "   Started: $UPTIME"
    else
        log_error "❌ Container not running"
        return 1
    fi
}

# Test direct access
test_direct_access() {
    log_info "Testing direct access..."
    
    if curl -s -f "http://localhost:$PORT" > /dev/null; then
        RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:$PORT")
        log_success "✅ Direct access OK (${RESPONSE_TIME}s)"
        
        # Test title
        TITLE=$(curl -s "http://localhost:$PORT" | grep -o '<title>[^<]*' | cut -d'>' -f2 | head -1)
        if [[ "$TITLE" == *"SEO Tool"* ]]; then
            log_success "✅ Page title correct: $TITLE"
        else
            log_warning "⚠️ Unexpected page title: $TITLE"
        fi
    else
        log_error "❌ Direct access failed"
        return 1
    fi
}

# Test network access
test_network_access() {
    log_info "Testing network access..."
    
    # Get server IP
    SERVER_IP=$(hostname -I | cut -d' ' -f1 2>/dev/null || echo "unknown")
    if [ "$SERVER_IP" != "unknown" ]; then
        if curl -s -f "http://$SERVER_IP:$PORT" > /dev/null; then
            log_success "✅ Network access OK: http://$SERVER_IP:$PORT"
        else
            log_warning "⚠️ Network access failed (firewall?)"
        fi
    fi
}

# Test reverse proxy
test_reverse_proxy() {
    log_info "Testing reverse proxy..."
    
    # Check if nginx is running
    if command -v nginx &> /dev/null; then
        if nginx -t 2>/dev/null; then
            log_success "✅ Nginx configuration valid"
            
            # Test domain routing
            if curl -s -f -H "Host: $DOMAIN" "http://localhost" > /dev/null; then
                log_success "✅ Domain routing OK: $DOMAIN"
            else
                log_warning "⚠️ Domain routing failed"
            fi
        else
            log_warning "⚠️ Nginx configuration has issues"
        fi
    else
        log_info "ℹ️ Nginx not found (direct access only)"
    fi
}

# Test SSL/HTTPS
test_ssl() {
    log_info "Testing SSL/HTTPS..."
    
    if curl -s -f "https://$DOMAIN" > /dev/null 2>&1; then
        SSL_EXPIRY=$(curl -s -vI "https://$DOMAIN" 2>&1 | grep "expire date" | cut -d: -f2- | xargs || echo "unknown")
        log_success "✅ HTTPS access OK"
        log_info "   SSL expires: $SSL_EXPIRY"
    else
        log_warning "⚠️ HTTPS access failed (normal if no SSL)"
    fi
}

# Performance test
test_performance() {
    log_info "Testing performance..."
    
    # Multiple requests
    TOTAL_TIME=0
    REQUESTS=5
    SUCCESS_COUNT=0
    
    for i in $(seq 1 $REQUESTS); do
        TIME=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:$PORT" 2>/dev/null || echo "0")
        if [ "$TIME" != "0" ]; then
            TOTAL_TIME=$(echo "$TOTAL_TIME + $TIME" | bc -l 2>/dev/null || echo "$TOTAL_TIME")
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi
    done
    
    if [ $SUCCESS_COUNT -gt 0 ]; then
        AVG_TIME=$(echo "scale=3; $TOTAL_TIME / $SUCCESS_COUNT" | bc -l 2>/dev/null || echo "unknown")
        log_success "✅ Performance test ($SUCCESS_COUNT/$REQUESTS requests)"
        log_info "   Average response time: ${AVG_TIME}s"
        
        if (( $(echo "$AVG_TIME < 1.0" | bc -l 2>/dev/null || echo 0) )); then
            log_success "✅ Response time excellent (<1s)"
        elif (( $(echo "$AVG_TIME < 3.0" | bc -l 2>/dev/null || echo 0) )); then
            log_success "✅ Response time good (<3s)"
        else
            log_warning "⚠️ Response time slow (>3s)"
        fi
    else
        log_error "❌ Performance test failed"
    fi
}

# Test logs
test_logs() {
    log_info "Checking recent logs..."
    
    ERROR_COUNT=$(docker logs "$CONTAINER_NAME" --since="1h" 2>&1 | grep -i "error" | wc -l || echo "0")
    WARNING_COUNT=$(docker logs "$CONTAINER_NAME" --since="1h" 2>&1 | grep -i "warning" | wc -l || echo "0")
    
    if [ "$ERROR_COUNT" -eq 0 ]; then
        log_success "✅ No errors in recent logs"
    else
        log_warning "⚠️ $ERROR_COUNT errors in recent logs"
    fi
    
    if [ "$WARNING_COUNT" -eq 0 ]; then
        log_success "✅ No warnings in recent logs"
    else
        log_info "ℹ️ $WARNING_COUNT warnings in recent logs"
    fi
}

# Test resources
test_resources() {
    log_info "Checking resource usage..."
    
    # CPU and Memory
    STATS=$(docker stats "$CONTAINER_NAME" --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" | tail -n 1)
    CPU=$(echo "$STATS" | cut -f1 | sed 's/%//')
    MEM=$(echo "$STATS" | cut -f2)
    
    log_success "✅ Resource usage: CPU ${CPU}%, Memory ${MEM}"
    
    # Disk space
    DISK_USAGE=$(df -h . | tail -1 | awk '{print $4}')
    log_info "   Available disk space: $DISK_USAGE"
}

# Main test function
main() {
    local TESTS_PASSED=0
    local TESTS_TOTAL=8
    
    # Run all tests
    test_container && TESTS_PASSED=$((TESTS_PASSED + 1))
    test_direct_access && TESTS_PASSED=$((TESTS_PASSED + 1))
    test_network_access && TESTS_PASSED=$((TESTS_PASSED + 1))
    test_reverse_proxy && TESTS_PASSED=$((TESTS_PASSED + 1))
    test_ssl && TESTS_PASSED=$((TESTS_PASSED + 1))
    test_performance && TESTS_PASSED=$((TESTS_PASSED + 1))
    test_logs && TESTS_PASSED=$((TESTS_PASSED + 1))
    test_resources && TESTS_PASSED=$((TESTS_PASSED + 1))
    
    echo ""
    echo "📊 Test Results: $TESTS_PASSED/$TESTS_TOTAL passed"
    
    if [ $TESTS_PASSED -eq $TESTS_TOTAL ]; then
        log_success "🎉 All tests passed! Server is running perfectly."
    elif [ $TESTS_PASSED -ge 6 ]; then
        log_success "✅ Server is running well with minor issues."
    elif [ $TESTS_PASSED -ge 4 ]; then
        log_warning "⚠️ Server is running but has some issues."
    else
        log_error "❌ Server has major issues that need attention."
    fi
    
    echo ""
    echo "🔗 Access URLs:"
    echo "   Direct: http://localhost:$PORT"
    echo "   Domain: https://$DOMAIN (if configured)"
    echo ""
    echo "📋 Quick Commands:"
    echo "   View logs: docker logs $CONTAINER_NAME"
    echo "   Restart: docker restart $CONTAINER_NAME"
    echo "   Update: ./deploy.sh"
}

# Run tests
main
