# 502 Bad Gateway Troubleshooting Guide

## 🚨 502 Bad Gateway Error Solutions

### 1. Container Health Issues

**Problem**: Container unhealthy or crashed
```bash
# Check container status
docker ps -a | grep seo

# Check health status
docker inspect ahmets-seo-tool-casaos | grep -A 5 "Health"

# Check logs
docker logs ahmets-seo-tool-casaos --tail 50
```

**Common Solutions**:
- Health check using `127.0.0.1` instead of `localhost`
- Container restart: `docker-compose -f docker-compose.casaos.yml restart`
- Container rebuild if needed

### 2. Port Conflicts

**Problem**: Port already in use
```bash
# Check what's using the port
netstat -tulpn | grep 9001

# Kill process if needed (Linux)
sudo lsof -ti:9001 | xargs kill -9

# Windows PowerShell
Get-NetTCPConnection -LocalPort 9001
```

**Solutions**:
- Use different port: Change `9001:80` to `9002:80`
- Stop conflicting service
- Use docker port mapping: `docker run -p 9002:80`

### 3. Nginx Configuration Issues

**Problem**: Nginx config errors
```bash
# Test nginx config inside container
docker exec ahmets-seo-tool-casaos nginx -t

# Check nginx status
docker exec ahmets-seo-tool-casaos ps aux | grep nginx
```

**Solutions**:
- Fix nginx.conf syntax errors
- Restart nginx: `docker exec ahmets-seo-tool-casaos nginx -s reload`
- Check file permissions

### 4. Reverse Proxy Issues

**Problem**: External reverse proxy (Traefik, Apache, Nginx)
```bash
# Check reverse proxy logs
docker logs traefik # if using Traefik
sudo tail -f /var/log/nginx/error.log # if using system nginx

# Test direct container access
curl -I http://localhost:9001
```

**Solutions**:
- Update reverse proxy config
- Check upstream definitions
- Verify proxy_pass directives
- Check SSL/TLS termination

### 5. Resource Exhaustion

**Problem**: Server out of resources
```bash
# Check memory usage
free -h
docker stats ahmets-seo-tool-casaos

# Check disk space
df -h

# Check CPU usage
top
htop
```

**Solutions**:
- Increase server resources
- Add memory limits: `mem_limit: 512m`
- Clean docker system: `docker system prune -f`
- Monitor resource usage

### 6. Network Issues

**Problem**: Docker network problems
```bash
# Check docker networks
docker network ls

# Inspect network
docker network inspect casaos-seo-tool-network

# Check container networking
docker exec ahmets-seo-tool-casaos ip addr
```

**Solutions**:
- Recreate network: `docker network rm casaos-seo-tool-network`
- Use bridge network mode
- Check firewall rules
- Restart docker daemon

### 7. DNS Resolution

**Problem**: DNS not working
```bash
# Test DNS inside container
docker exec ahmets-seo-tool-casaos nslookup localhost
docker exec ahmets-seo-tool-casaos cat /etc/resolv.conf

# Test external DNS
docker exec ahmets-seo-tool-casaos nslookup google.com
```

**Solutions**:
- Use IP addresses instead of hostnames
- Configure custom DNS: `dns: ["8.8.8.8", "1.1.1.1"]`
- Check host DNS configuration

### 8. Security & Firewall

**Problem**: Firewall blocking connections
```bash
# Check iptables (Linux)
sudo iptables -L

# Check ufw status (Ubuntu)
sudo ufw status

# Windows Firewall
Get-NetFirewallRule | Where-Object {$_.Direction -eq "Inbound" -and $_.Action -eq "Block"}
```

**Solutions**:
- Open port in firewall: `sudo ufw allow 9001`
- Disable firewall temporarily for testing
- Check Docker iptables rules
- Configure port forwarding

## 🔧 Quick Fixes

### Immediate Actions
1. **Restart Container**: `docker-compose restart`
2. **Check Logs**: `docker logs container_name`
3. **Test Health**: `docker exec container_name curl http://localhost`
4. **Resource Check**: `docker stats`

### Health Check Fix
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://127.0.0.1:80/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Emergency Container Start
```bash
# If compose fails, try direct docker run
docker run -d \
  --name emergency-seo-tool \
  --restart unless-stopped \
  -p 9001:80 \
  axxmet/ahmets-special-seo-tool:casaos
```

## 📊 Monitoring Commands

```bash
# Real-time container status
watch "docker ps | grep seo"

# Live logs
docker logs -f ahmets-seo-tool-casaos

# Resource monitoring
docker stats ahmets-seo-tool-casaos

# Health check status
docker inspect ahmets-seo-tool-casaos | grep -A 10 "Health"
```

## 🆘 When All Else Fails

1. **Complete Reset**:
```bash
docker-compose down --volumes --remove-orphans
docker system prune -af
docker-compose up -d
```

2. **Fresh Installation**:
```bash
docker stop ahmets-seo-tool-casaos
docker rm ahmets-seo-tool-casaos
docker rmi axxmet/ahmets-special-seo-tool:casaos
docker pull axxmet/ahmets-special-seo-tool:casaos
docker-compose up -d
```

3. **Debug Mode**:
```bash
# Run container interactively
docker run -it --rm \
  -p 9001:80 \
  axxmet/ahmets-special-seo-tool:casaos \
  /bin/sh
```

## 📞 Support Resources

- **GitHub Issues**: https://github.com/Ahmet-Dev/ahmetsspecialseotool/issues
- **Docker Hub**: https://hub.docker.com/r/axxmet/ahmets-special-seo-tool
- **Documentation**: Check CASAOS-INSTALLATION.md
