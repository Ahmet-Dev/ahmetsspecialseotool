# Ahmet's Special SEO Tool - Production Deployment Script (Windows)
# Copyright © 2025 Ahmet Kahraman

param(
    [switch]$Force,
    [string]$Port = "1389",
    [string]$Image = "axxmet/ahmets-special-seo-tool:latest"
)

$ErrorActionPreference = "Stop"

# Configuration
$ContainerName = "ahmets-seo-tool-production"

# Colors for output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        default { Write-Host $Message }
    }
}

function Write-Info { param([string]$Message) Write-ColorOutput "[INFO] $Message" "Blue" }
function Write-Success { param([string]$Message) Write-ColorOutput "[SUCCESS] $Message" "Green" }
function Write-Warning { param([string]$Message) Write-ColorOutput "[WARNING] $Message" "Yellow" }
function Write-Error { param([string]$Message) Write-ColorOutput "[ERROR] $Message" "Red" }

Write-ColorOutput "🚀 Ahmet's Special SEO Tool - Production Deployment" "Green"
Write-ColorOutput "==================================================" "Green"

# Check Docker installation
function Test-Docker {
    Write-Info "Checking Docker installation..."
    
    try {
        $dockerVersion = docker --version
        $composeVersion = docker-compose --version
        Write-Success "Docker and Docker Compose are available"
        Write-Info "Docker: $dockerVersion"
        Write-Info "Compose: $composeVersion"
    }
    catch {
        Write-Error "Docker is not installed or not accessible"
        Write-Error "Please install Docker Desktop for Windows"
        exit 1
    }
}

# Check port availability
function Test-Port {
    param([string]$PortNumber)
    
    Write-Info "Checking port $PortNumber availability..."
    
    $portInUse = Get-NetTCPConnection -LocalPort $PortNumber -ErrorAction SilentlyContinue
    if ($portInUse -and -not $Force) {
        Write-Warning "Port $PortNumber is already in use"
        $response = Read-Host "Continue anyway? (y/N)"
        if ($response -ne "y" -and $response -ne "Y") {
            exit 1
        }
    }
}

# Stop existing container
function Stop-ExistingContainer {
    Write-Info "Stopping existing containers..."
    
    try {
        $existingContainer = docker ps -a --filter "name=$ContainerName" --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
        
        if ($existingContainer) {
            Write-Info "Stopping existing container: $ContainerName"
            docker stop $ContainerName 2>$null
            docker rm $ContainerName 2>$null
            Write-Success "Existing container removed"
        } else {
            Write-Info "No existing container found"
        }
    }
    catch {
        Write-Warning "Error removing existing container: $_"
    }
}

# Pull latest image
function Get-LatestImage {
    Write-Info "Pulling latest Docker image: $Image"
    
    try {
        docker pull $Image
        Write-Success "Latest image pulled successfully"
    }
    catch {
        Write-Error "Failed to pull image: $_"
        exit 1
    }
}

# Deploy container
function Start-Container {
    Write-Info "Deploying SEO Tool container..."
    
    try {
        $deployCommand = @(
            "run", "-d",
            "--name", $ContainerName,
            "--restart", "unless-stopped",
            "-p", "$Port`:80",
            "-e", "NODE_ENV=production",
            "-e", "TZ=Europe/Istanbul",
            "--security-opt", "no-new-privileges:true",
            "--log-opt", "max-size=10m",
            "--log-opt", "max-file=3",
            $Image
        )
        
        & docker @deployCommand
        Write-Success "Container deployed successfully"
    }
    catch {
        Write-Error "Failed to deploy container: $_"
        exit 1
    }
}

# Health check
function Test-ContainerHealth {
    Write-Info "Performing health check..."
    
    Start-Sleep -Seconds 10
    
    $maxAttempts = 12
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $healthCheck = docker exec $ContainerName curl -f http://localhost/ 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Health check passed"
                return $true
            }
        }
        catch {
            # Continue trying
        }
        
        Write-Info "Health check attempt $attempt/$maxAttempts failed, retrying..."
        Start-Sleep -Seconds 5
        $attempt++
    }
    
    Write-Error "Health check failed after $maxAttempts attempts"
    return $false
}

# Show deployment status
function Show-Status {
    Write-Info "Container status:"
    docker ps -a --filter "name=$ContainerName" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Info "Application URLs:"
    Write-Host "  🌐 Local: http://localhost:$Port" -ForegroundColor Cyan
    
    # Try to get public IP
    try {
        $publicIP = (Invoke-WebRequest -Uri "http://ifconfig.me" -UseBasicParsing).Content.Trim()
        Write-Host "  🌐 Server: http://$publicIP`:$Port" -ForegroundColor Cyan
    }
    catch {
        Write-Host "  🌐 Server: http://YOUR_SERVER_IP:$Port" -ForegroundColor Cyan
    }
    
    Write-Info "Management commands:"
    Write-Host "  📝 View logs: docker logs $ContainerName" -ForegroundColor Gray
    Write-Host "  📝 Follow logs: docker logs -f $ContainerName" -ForegroundColor Gray
    Write-Host "  🔄 Restart: docker restart $ContainerName" -ForegroundColor Gray
    Write-Host "  🛑 Stop: docker stop $ContainerName" -ForegroundColor Gray
    Write-Host "  🗑️ Remove: docker rm -f $ContainerName" -ForegroundColor Gray
}

# Main deployment process
try {
    Write-Host ""
    Write-Info "Starting deployment process..."
    Write-Info "Container: $ContainerName"
    Write-Info "Image: $Image"
    Write-Info "Port: $Port"
    Write-Host ""
    
    Test-Docker
    Test-Port -PortNumber $Port
    Stop-ExistingContainer
    Get-LatestImage
    Start-Container
    
    if (Test-ContainerHealth) {
        Show-Status
        Write-Success "🎉 Deployment completed successfully!"
        Write-Host ""
        Write-ColorOutput "🔒 Security Notice:" "Yellow"
        Write-Host "This application is protected by copyright."
        Write-Host "Commercial use requires permission from Ahmet Kahraman."
        Write-Host "Contact: iletisimahmetkahraman@gmail.com"
        Write-Host ""
    } else {
        Write-Error "Deployment failed during health check"
        Write-Warning "Container logs (last 20 lines):"
        docker logs $ContainerName --tail 20
        exit 1
    }
}
catch {
    Write-Error "Deployment failed: $_"
    Write-Warning "Cleaning up..."
    docker rm -f $ContainerName 2>$null
    exit 1
}
