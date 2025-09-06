# 🔧 Server Deployment Troubleshooting Guide

## 🚨 Common Server Deployment Issues

### Problem: Container fails to start
**Symptoms**: Container exits immediately or shows "Restarting" status

**Diagnostic Commands**:
```bash
# Check container status
docker ps -a

# View container logs
docker logs ahmets-seo-tool-production

# Check system resources
free -h
df -h
```

**Solutions**:
1. **Memory Issues**:
   ```bash
   # Check available memory
   free -m
   # If < 512MB, close other services or upgrade server
   ```

2. **Port Conflicts**:
   ```bash
   # Check if port 1389 is in use
   netstat -tlnp | grep :1389
   # Kill process or use different port
   ```

3. **Disk Space**:
   ```bash
   # Check disk space
   df -h
   # Clean up if needed
   docker system prune -f
   ```

### Problem: Application loads but shows errors
**Symptoms**: White screen, JavaScript errors, 502/503 errors

**Diagnostic Commands**:
```bash
# Check nginx logs inside container
docker exec ahmets-seo-tool-production cat /var/log/nginx/error.log

# Check application accessibility
curl -I http://localhost:1389

# Test container health
docker exec ahmets-seo-tool-production curl -f http://localhost/
```

**Solutions**:
1. **Nginx Configuration**:
   ```bash
   # Test nginx config
   docker exec ahmets-seo-tool-production nginx -t
   ```

2. **File Permissions**:
   ```bash
   # Check if files are accessible
   docker exec ahmets-seo-tool-production ls -la /usr/share/nginx/html/
   ```

### Problem: Cannot access from external IP
**Symptoms**: Works on localhost but not from external IP

**Diagnostic Commands**:
```bash
# Check if port is open
nmap -p 1389 YOUR_SERVER_IP

# Check firewall
ufw status  # Ubuntu
firewall-cmd --list-ports  # CentOS/RHEL
```

**Solutions**:
1. **Firewall Configuration**:
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 1389
   
   # CentOS/RHEL
   sudo firewall-cmd --permanent --add-port=1389/tcp
   sudo firewall-cmd --reload
   ```

2. **Cloud Provider Security Groups**:
   - AWS: Add inbound rule for port 1389
   - Google Cloud: Configure firewall rules
   - Azure: Configure Network Security Groups

### Problem: SSL/HTTPS Issues
**Symptoms**: Mixed content warnings, SSL certificate errors

**Solutions**:
1. **Use Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:1389;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

2. **SSL Termination with Certbot**:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## 🔍 Step-by-Step Debugging Process

### 1. Server Environment Check
```bash
# Check Docker installation
docker --version
docker-compose --version

# Check system resources
echo "=== MEMORY ==="
free -h
echo "=== DISK ==="
df -h
echo "=== CPU ==="
top -bn1 | head -20
```

### 2. Network Connectivity
```bash
# Test internal connectivity
curl -I http://localhost:1389

# Test external connectivity (from another machine)
curl -I http://YOUR_SERVER_IP:1389

# Check port binding
netstat -tlnp | grep :1389
```

### 3. Container Diagnostics
```bash
# Container status
docker ps -a --filter "name=ahmets-seo-tool"

# Resource usage
docker stats ahmets-seo-tool-production --no-stream

# Execute commands inside container
docker exec -it ahmets-seo-tool-production /bin/sh
```

### 4. Log Analysis
```bash
# Application logs
docker logs ahmets-seo-tool-production

# Nginx access logs
docker exec ahmets-seo-tool-production tail -f /var/log/nginx/access.log

# Nginx error logs
docker exec ahmets-seo-tool-production tail -f /var/log/nginx/error.log

# System logs
journalctl -u docker.service --since "1 hour ago"
```

## 🚀 Quick Deployment Commands

### Fresh Deployment:
```bash
# Download deployment script
curl -o deploy.sh https://raw.githubusercontent.com/Ahmet-Dev/ahmetsspecialseotool/main/deploy.sh
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Manual Deployment:
```bash
# Stop existing container
docker rm -f ahmets-seo-tool-production

# Pull latest image
docker pull axxmet/ahmets-special-seo-tool:latest

# Run container
docker run -d \
  --name ahmets-seo-tool-production \
  --restart unless-stopped \
  -p 1389:80 \
  -e NODE_ENV=production \
  axxmet/ahmets-special-seo-tool:latest

# Check status
docker ps
```

### Using Docker Compose:
```bash
# Download production compose file
curl -o docker-compose.production.yml https://raw.githubusercontent.com/Ahmet-Dev/ahmetsspecialseotool/main/docker-compose.production.yml

# Deploy
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

## 📞 Support

If you continue experiencing issues:

1. **Collect Information**:
   ```bash
   echo "=== SYSTEM INFO ===" > debug.log
   uname -a >> debug.log
   docker --version >> debug.log
   echo "=== CONTAINER STATUS ===" >> debug.log
   docker ps -a >> debug.log
   echo "=== CONTAINER LOGS ===" >> debug.log
   docker logs ahmets-seo-tool-production >> debug.log 2>&1
   ```

2. **Contact Support**:
   - **Email**: iletisimahmetkahraman@gmail.com
   - **Subject**: "Server Deployment Issue - SEO Tool"
   - **Include**: debug.log file and server details

---

**Copyright © 2025 Ahmet Kahraman. All rights reserved.**
