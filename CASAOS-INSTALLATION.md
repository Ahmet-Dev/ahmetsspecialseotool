# CasaOS Installation Guide

## Ahmet's Special SEO Tool for CasaOS

This guide explains how to install and run Ahmet's Special SEO Tool on CasaOS.

## Quick Installation Methods

### Method 1: Using Docker Command (Recommended)

Open CasaOS terminal and run:

```bash
docker run -d \
  --name ahmets-seo-tool \
  --restart unless-stopped \
  -p 9001:80 \
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
  axxmet/ahmets-special-seo-tool:latest
```

### Method 2: Using Docker Compose

1. Upload `docker-compose.casaos.yml` to your CasaOS file manager
2. Navigate to the file location in terminal
3. Run: `docker-compose -f docker-compose.casaos.yml up -d`

### Method 3: CasaOS App Store (Custom App)

1. Open CasaOS App Store
2. Click "Install a custom App" or "+" button
3. Upload the `casaos-app-config.json` file
4. Configure settings and install

## Access Information

- **Web Interface**: `http://YOUR_CASAOS_IP:9001`
- **Container Name**: `ahmets-seo-tool-casaos`
- **Default Port**: `9001`

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `TZ` | `Europe/Istanbul` | Container timezone |

### Port Configuration

- **Container Port**: `80` (internal)
- **Host Port**: `9001` (configurable)
- **Protocol**: `TCP`

## Health Check

The container includes automatic health checking:
- **Check Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3
- **Start Period**: 40 seconds

## Security Features

- **Read-only filesystem** for enhanced security
- **Dropped capabilities** except essential ones
- **No new privileges** policy
- **Temporary filesystems** for cache and runtime

## Resource Requirements

- **Memory**: ~256MB recommended
- **CPU**: Low usage, 0.5 CPU shares
- **Storage**: ~100MB for container image
- **Architecture**: Supports AMD64 and ARM64

## Troubleshooting

### Container Not Starting
```bash
# Check container logs
docker logs ahmets-seo-tool

# Check container status
docker ps -a | grep ahmets-seo
```

### Port Conflicts
If port 9001 is already in use:
```bash
# Check what's using the port
netstat -tulpn | grep 9001

# Use different port (e.g., 9002)
docker run ... -p 9002:80 ...
```

### Access Issues
1. Verify CasaOS firewall settings
2. Check if the port is accessible: `curl http://localhost:9001`
3. Ensure no reverse proxy conflicts

## Updating

To update to the latest version:
```bash
# Stop and remove old container
docker stop ahmets-seo-tool
docker rm ahmets-seo-tool

# Pull latest image
docker pull axxmet/ahmets-special-seo-tool:latest

# Run new container (use same command as installation)
```

## Uninstalling

```bash
# Stop and remove container
docker stop ahmets-seo-tool
docker rm ahmets-seo-tool

# Remove image (optional)
docker rmi axxmet/ahmets-special-seo-tool:latest
```

## Support

For issues and support:
- **GitHub**: https://github.com/Ahmet-Dev/ahmetsspecialseotool
- **Docker Hub**: https://hub.docker.com/r/axxmet/ahmets-special-seo-tool

## License

This software is protected by copyright. See LICENSE file for details.
